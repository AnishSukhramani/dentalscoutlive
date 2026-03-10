import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuthOrCron } from '@/lib/authApi';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Initialize Supabase client (server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Infer IMAP host from email domain. Returns { host, port, secure }.
 */
function getImapConfigForEmail(email, userOverrides = {}) {
  if (userOverrides.imap_host) {
    return {
      host: userOverrides.imap_host,
      port: Number(userOverrides.imap_port) || 993,
      secure: userOverrides.imap_secure !== false
    };
  }
  const domain = (email || '').split('@')[1]?.toLowerCase() || '';
  if (domain.includes('gmail') || domain.includes('google')) {
    return { host: 'imap.gmail.com', port: 993, secure: true };
  }
  if (['outlook.com', 'hotmail.com', 'live.com', 'office365.com', 'outlook.co'].some((d) => domain.includes(d))) {
    return { host: 'outlook.office365.com', port: 993, secure: true };
  }
  if (domain.includes('yahoo')) {
    return { host: 'imap.mail.yahoo.com', port: 993, secure: true };
  }
  // Custom domains (e.g. neuralityhealth.*) often use Google Workspace
  return { host: 'imap.gmail.com', port: 993, secure: true };
}

/**
 * Load inbox configs from user.json. Each user gets IMAP config + resolved password from env.
 */
async function loadInboxConfigs() {
  const userFilePath = join(process.cwd(), 'data', 'user.json');
  const data = await readFile(userFilePath, 'utf8');
  const userData = JSON.parse(data);
  const configs = [];

  for (const user of userData.users || []) {
    const envKey = (user.password || '').replace(/^process\.env\./, '').replace(/\)$/, '').trim();
    const pass = envKey ? process.env[envKey] : user.password;
    if (!pass || !user.email) {
      console.log(`[syncReplies] Skipping ${user.email || 'unknown'}: no password configured`);
      continue;
    }

    const imap = getImapConfigForEmail(user.email, user);
    configs.push({
      email: user.email,
      host: imap.host,
      port: imap.port,
      secure: imap.secure,
      user: user.email,
      pass
    });
  }

  return configs;
}

/**
 * Process a single reply message: match against tracking/fallback, update DB.
 */
async function processReplyMessage(supabase, inReplyTo, replyAt) {
  const { data: trackingRow, error: trackingError } = await supabase
    .from('outbound_message_tracking')
    .select('practice_id, template_id, campaign_id, touch_key')
    .eq('message_id', inReplyTo)
    .maybeSingle();

  if (!trackingError && trackingRow) {
    const { data: practice, error: fetchErr } = await supabase
      .from('practices')
      .select('id, reply_meta')
      .eq('id', trackingRow.practice_id)
      .single();
    if (fetchErr || !practice) return { matched: 0, updated: 0 };

    const currentMeta = practice.reply_meta || {};
    const newMeta = {
      ...currentMeta,
      has_replied: true,
      last_reply_at: replyAt,
      reply_count: (currentMeta.reply_count || 0) + 1,
      replied_to_template_id: trackingRow.template_id
    };
    const { error: updateError } = await supabase
      .from('practices')
      .update({ reply_meta: newMeta })
      .eq('id', practice.id);

    if (updateError) {
      console.error('Error updating practice reply_meta during sync:', updateError);
      return { matched: 1, updated: 0 };
    }

    if (trackingRow.campaign_id && trackingRow.touch_key) {
      await supabase.from('campaign_reply_tokens').insert({
        practice_id: trackingRow.practice_id,
        campaign_id: trackingRow.campaign_id,
        touch_key: trackingRow.touch_key,
        template_id: trackingRow.template_id,
        in_reply_to_message_id: inReplyTo,
        replied_at: replyAt
      });
      // Ignore duplicate key errors (same reply seen in multiple inboxes)
    }
    return { matched: 1, updated: 1 };
  }

  const { data: practices, error } = await supabase
    .from('practices')
    .select('id, reply_meta')
    .contains('reply_meta', { last_outbound_message_id: inReplyTo });

  if (error || !practices?.length) return { matched: 0, updated: 0 };

  let updated = 0;
  for (const practice of practices) {
    const currentMeta = practice.reply_meta || {};
    if (currentMeta.has_replied && currentMeta.last_reply_at) continue;

    const newMeta = {
      ...currentMeta,
      has_replied: true,
      last_reply_at: replyAt,
      reply_count: (currentMeta.reply_count || 0) + 1
    };
    const { error: updateError } = await supabase
      .from('practices')
      .update({ reply_meta: newMeta })
      .eq('id', practice.id);
    if (!updateError) updated += 1;
  }
  return { matched: practices.length, updated };
}

/**
 * Sync a single inbox and return { checked, matched, updated }.
 */
async function syncInbox(ImapFlow, config) {
  let client;
  let checked = 0;
  let matched = 0;
  let updated = 0;

  try {
    client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass }
    });
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      const now = new Date();
      const sinceDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const messageSeqs = await client.search({ since: sinceDate });

      for await (const message of client.fetch(messageSeqs, {
        envelope: true,
        internalDate: true
      })) {
        checked += 1;
        const inReplyToRaw = message.envelope?.inReplyTo;
        if (!inReplyToRaw) continue;

        const inReplyTo = inReplyToRaw.trim();
        const replyAt =
          message.internalDate?.toISOString?.() || new Date().toISOString();

        const result = await processReplyMessage(supabase, inReplyTo, replyAt);
        matched += result.matched;
        updated += result.updated;
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err) {
    console.error(`[syncReplies] Error syncing ${config.email}:`, err.message);
    if (client) {
      try {
        await client.logout();
      } catch {
        /* ignore */
      }
    }
  }

  return { checked, matched, updated };
}

/**
 * Sync email replies from ALL configured inboxes (user.json) into practices.reply_meta.
 *
 * - Loads inbox configs from user.json (email + app password from env)
 * - Connects to each inbox via IMAP
 * - For each message with In-Reply-To, matches against outbound_message_tracking or reply_meta
 * - Updates practices.reply_meta and campaign_reply_tokens
 */
export async function POST(request) {
  const auth = await requireAuthOrCron(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const configs = await loadInboxConfigs();
    if (configs.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No inbox configs found. Ensure user.json has users with passwords set via env (e.g. GMAIL_APP_PASSWORD, GMAIL_APP_PASSWORD_2).'
        },
        { status: 500 }
      );
    }

    const { ImapFlow } = await import('imapflow');

    let totalChecked = 0;
    let totalMatched = 0;
    let totalUpdated = 0;
    const inboxResults = [];

    for (const config of configs) {
      console.log(`[syncReplies] Syncing inbox: ${config.email}`);
      const result = await syncInbox(ImapFlow, config);
      totalChecked += result.checked;
      totalMatched += result.matched;
      totalUpdated += result.updated;
      inboxResults.push({ email: config.email, ...result });
    }

    return NextResponse.json({
      success: true,
      inboxesSynced: configs.length,
      inboxResults,
      checkedMessages: totalChecked,
      matchedPractices: totalMatched,
      updatedPractices: totalUpdated
    });
  } catch (error) {
    console.error('Error during reply sync:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error during reply sync' },
      { status: 500 }
    );
  }
}
