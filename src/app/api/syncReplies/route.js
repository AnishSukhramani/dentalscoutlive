import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (server-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sync email replies from the main inbox into the practices.reply_meta JSON field.
 *
 * This endpoint:
 * - Connects to the main inbox via IMAP
 * - Reads recent messages from INBOX
 * - For each message with an In-Reply-To header, tries to match it against
 *   practices.reply_meta.last_outbound_message_id
 * - If a match is found, updates reply_meta.has_replied and reply_meta.last_reply_at
 */
export async function POST() {
  const {
    REPLY_IMAP_HOST,
    REPLY_IMAP_PORT,
    REPLY_IMAP_SECURE,
    REPLY_EMAIL_USER,
    REPLY_EMAIL_PASSWORD
  } = process.env;

  if (!REPLY_IMAP_HOST || !REPLY_EMAIL_USER || !REPLY_EMAIL_PASSWORD) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing IMAP configuration. Please set REPLY_IMAP_HOST, REPLY_EMAIL_USER, and REPLY_EMAIL_PASSWORD.'
      },
      { status: 500 }
    );
  }

  let client;

  try {
    const { ImapFlow } = await import('imapflow');

    client = new ImapFlow({
      host: REPLY_IMAP_HOST,
      port: Number(REPLY_IMAP_PORT) || 993,
      secure: REPLY_IMAP_SECURE !== 'false',
      auth: {
        user: REPLY_EMAIL_USER,
        pass: REPLY_EMAIL_PASSWORD
      }
    });

    await client.connect();

    const lock = await client.getMailboxLock('INBOX');

    let checked = 0;
    let matched = 0;
    let updated = 0;

    try {
      // Limit scanning to messages from the last 24 hours to keep the
      // operation fast and avoid timeouts on large mailboxes.
      const now = new Date();
      const sinceDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      console.log('[syncReplies] Searching for messages since', sinceDate.toISOString());
      const messageSeqs = await client.search({ since: sinceDate });
      console.log('[syncReplies] Found', messageSeqs.length, 'messages in the last 24 hours');

      if (!messageSeqs || messageSeqs.length === 0) {
        console.log('[syncReplies] No messages to process in the last 24 hours');
      }

      // Fetch just those recent messages
      for await (const message of client.fetch(messageSeqs, {
        envelope: true,
        internalDate: true
      })) {
        checked += 1;

        // Use the parsed envelope's inReplyTo field instead of raw headers
        const inReplyToRaw = message.envelope?.inReplyTo;
        if (!inReplyToRaw) {
          // This message is not a reply; skip it
          continue;
        }

        const inReplyTo = inReplyToRaw.trim();
        console.log('[syncReplies] In-Reply-To from envelope:', inReplyTo);

        const replyAt =
          (message.internalDate && message.internalDate.toISOString
            ? message.internalDate.toISOString()
            : new Date().toISOString());

        // Step 3: Prefer outbound_message_tracking so we can set replied_to_template_id
        const { data: trackingRow, error: trackingError } = await supabase
          .from('outbound_message_tracking')
          .select('practice_id, template_id, campaign_id, touch_key')
          .eq('message_id', inReplyTo)
          .maybeSingle();

        if (!trackingError && trackingRow) {
          // Found in tracking table: update this practice with template attribution
          matched += 1;
          const { data: practice, error: fetchErr } = await supabase
            .from('practices')
            .select('id, reply_meta')
            .eq('id', trackingRow.practice_id)
            .single();
          if (fetchErr || !practice) {
            continue;
          }
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
          if (!updateError) {
            updated += 1;
          } else {
            console.error('Error updating practice reply_meta during sync:', updateError);
          }

          // If this send came from a campaign touchpoint, create a token row
          if (trackingRow.campaign_id && trackingRow.touch_key) {
            const { error: tokenError } = await supabase
              .from('campaign_reply_tokens')
              .insert({
                practice_id: trackingRow.practice_id,
                campaign_id: trackingRow.campaign_id,
                touch_key: trackingRow.touch_key,
                template_id: trackingRow.template_id,
                in_reply_to_message_id: inReplyTo,
                replied_at: replyAt
              });
            if (tokenError) {
              console.error('Error inserting campaign_reply_tokens:', tokenError);
            }
          }

          continue;
        }

        // Fallback: match by reply_meta.last_outbound_message_id (e.g. messages sent before tracking table)
        const { data: practices, error } = await supabase
          .from('practices')
          .select('id, reply_meta')
          .contains('reply_meta', { last_outbound_message_id: inReplyTo });

        if (error) {
          console.error('Error querying practices for reply sync:', error);
          continue;
        }

        if (!practices || practices.length === 0) {
          continue;
        }

        matched += practices.length;

        for (const practice of practices) {
          const currentMeta = practice.reply_meta || {};

          if (currentMeta.has_replied && currentMeta.last_reply_at) {
            continue;
          }

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

          if (updateError) {
            console.error('Error updating practice reply_meta during sync:', updateError);
          } else {
            updated += 1;
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return NextResponse.json({
      success: true,
      checkedMessages: checked,
      matchedPractices: matched,
      updatedPractices: updated
    });
  } catch (error) {
    console.error('Error during reply sync:', error);

    if (client) {
      try {
        await client.logout();
      } catch {
        // ignore
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error during reply sync'
      },
      { status: 500 }
    );
  }
}

