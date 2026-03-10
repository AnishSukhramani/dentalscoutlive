import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'fs/promises';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Date-based scheduling: each touchpoint (except tp1, which is manual) has scheduled_date (YYYY-MM-DD).
// Cron runs daily and queues when today (IST) >= touchpoint's scheduled_date.

function requireCronSecret(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false, error: 'CRON_SECRET not configured' };
  const authHeader = request.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const headerSecret = request.headers.get('x-cron-secret') || bearer;
  if (headerSecret !== secret) return { ok: false, error: 'Unauthorized' };
  return { ok: true };
}

export async function POST(request) {
  const auth = requireCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  try {
    // 1) Sync replies so we have latest reply/token state
    if (baseUrl) {
      try {
        const syncRes = await fetch(`${baseUrl}/api/syncReplies`, {
          method: 'POST',
          headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
        });
        const syncJson = await syncRes.json();
        if (!syncRes.ok) console.error('[campaign-progression] Sync replies failed:', syncJson);
      } catch (e) {
        console.error('[campaign-progression] Sync replies error:', e);
      }
    }

    const senderEmail = process.env.CRON_SENDER_EMAIL;
    const senderName = process.env.CRON_SENDER_NAME || 'Campaign';
    if (!senderEmail) {
      return NextResponse.json(
        { error: 'CRON_SENDER_EMAIL is required for campaign progression' },
        { status: 500 }
      );
    }

    // 2) Load campaigns with touchpoints
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name, touchpoints');

    if (campaignsError || !campaigns?.length) {
      return NextResponse.json({
        success: true,
        queued: 0,
        message: campaignsError ? 'Failed to load campaigns' : 'No campaigns',
      });
    }

    // 3) Build (campaign_id, email_template_id) -> { index, touch_key }
    const templateToTouchpoint = new Map();
    for (const campaign of campaigns) {
      const touchpoints = campaign.touchpoints || [];
      for (let i = 0; i < touchpoints.length; i++) {
        const tp = touchpoints[i];
        const uuid = tp.template_id;
        if (!uuid) continue;
        const { data: tmpl } = await supabase
          .from('email_templates')
          .select('id')
          .eq('template_id', uuid)
          .eq('campaign_id', campaign.id)
          .maybeSingle();
        if (tmpl?.id) {
          templateToTouchpoint.set(`${campaign.id}:${tmpl.id}`, {
            index: i,
            touch_key: tp.touch_key || `tp${i + 1}`,
          });
        }
        const { data: tmplFallback } = await supabase
          .from('email_templates')
          .select('id')
          .eq('template_id', uuid)
          .maybeSingle();
        if (tmplFallback?.id && !templateToTouchpoint.has(`${campaign.id}:${tmplFallback.id}`)) {
          templateToTouchpoint.set(`${campaign.id}:${tmplFallback.id}`, {
            index: i,
            touch_key: tp.touch_key || `tp${i + 1}`,
          });
        }
      }
    }

    // 4) Outbound sends: campaign_id, practice_id, template_id, sent_at, sender_email
    const { data: outboundRows, error: outboundError } = await supabase
      .from('outbound_message_tracking')
      .select('campaign_id, practice_id, template_id, sent_at, sender_email');

    if (outboundError) {
      return NextResponse.json(
        { error: 'Failed to load outbound_message_tracking', details: outboundError.message },
        { status: 500 }
      );
    }

    const outbound = outboundRows || [];
    const templateIdToCampaignIds = new Map();
    for (const key of templateToTouchpoint.keys()) {
      const [, tid] = key.split(':');
      const cid = key.split(':')[0];
      if (!templateIdToCampaignIds.has(tid)) templateIdToCampaignIds.set(tid, []);
      templateIdToCampaignIds.get(tid).push(cid);
    }

    // 5) Last touchpoint sent per (campaign_id, practice_id): { index, sentAt, touch_key, sender_email }
    const lastSentByCampaignPractice = new Map();
    for (const row of outbound) {
      const campaignIds = row.campaign_id
        ? [row.campaign_id]
        : templateIdToCampaignIds.get(row.template_id) || [];
      for (const cid of campaignIds) {
        const key = `${cid}:${row.practice_id}`;
        const meta = templateToTouchpoint.get(`${cid}:${row.template_id}`);
        if (!meta) continue;
        const sentAt = row.sent_at ? new Date(row.sent_at).getTime() : 0;
        const cur = lastSentByCampaignPractice.get(key);
        if (!cur || meta.index > cur.index || (meta.index === cur.index && sentAt > cur.sentAt)) {
          lastSentByCampaignPractice.set(key, {
            index: meta.index,
            sentAt,
            touch_key: meta.touch_key,
            sender_email: row.sender_email || null
          });
        }
      }
    }

    // 6) Repliers per campaign
    const { data: tokens } = await supabase
      .from('campaign_reply_tokens')
      .select('campaign_id, practice_id');
    const repliedSet = new Set((tokens || []).map((t) => `${t.campaign_id}:${t.practice_id}`));

    // 7) Decide who gets next touchpoint (date-based: scheduled_date per touchpoint)
    const toQueue = [];
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD

    for (const campaign of campaigns) {
      const touchpoints = campaign.touchpoints || [];
      if (touchpoints.length < 2) continue;

      for (const [key, value] of lastSentByCampaignPractice) {
        if (!key.startsWith(`${campaign.id}:`)) continue;
        if (repliedSet.has(key)) continue;
        const practiceId = key.split(':')[1];
        const nextIndex = value.index + 1;
        if (nextIndex >= touchpoints.length) continue;

        const nextTp = touchpoints[nextIndex];
        const scheduledDate = nextTp?.scheduled_date;
        if (!scheduledDate) continue; // No date configured - skip (user must set in Templates)
        if (todayIST < scheduledDate) continue; // Not yet due
        const nextUuid = nextTp?.template_id;
        if (!nextUuid) continue;

        let emailTemplateId = null;
        const { data: et } = await supabase
          .from('email_templates')
          .select('id')
          .eq('template_id', nextUuid)
          .eq('campaign_id', campaign.id)
          .maybeSingle();
        if (et?.id) emailTemplateId = et.id;
        if (!emailTemplateId) {
          const { data: et2 } = await supabase
            .from('email_templates')
            .select('id')
            .eq('template_id', nextUuid)
            .maybeSingle();
          if (et2?.id) emailTemplateId = et2.id;
        }
        if (!emailTemplateId) continue;

        const lastSent = lastSentByCampaignPractice.get(`${campaign.id}:${practiceId}`);
        toQueue.push({
          campaign_id: campaign.id,
          practice_id: practiceId,
          template_id: emailTemplateId,
          touch_key: nextTp.touch_key || `tp${nextIndex + 1}`,
          sender_email: lastSent?.sender_email || null
        });
      }
    }

    if (toQueue.length === 0) {
      return NextResponse.json({
        success: true,
        queued: 0,
        message: 'No contacts due for next touchpoint',
      });
    }

    const practiceIds = [...new Set(toQueue.map((q) => q.practice_id))];
    const { data: practices, error: practicesError } = await supabase
      .from('practices')
      .select('id, email, first_name, practice_name, owner_name, domain_url, phone_number')
      .in('id', practiceIds);

    if (practicesError || !practices?.length) {
      return NextResponse.json({
        success: true,
        queued: 0,
        message: 'Could not load practices for queued contacts',
      });
    }

    const practiceMap = new Map(practices.map((p) => [p.id, p]));

    // Build sender email -> displayName map from user.json (for follow-up sender name)
    let senderNameByEmail = {};
    try {
      const userData = JSON.parse(
        await readFile(join(process.cwd(), 'data', 'user.json'), 'utf8')
      );
      const users = userData.users || [];
      for (const u of users) {
        senderNameByEmail[u.email] = u.displayName || u.name || 'Campaign';
      }
    } catch (e) {
      console.warn('[campaign-progression] Could not load user.json for sender names:', e.message);
    }

    const entries = [];
    for (const q of toQueue) {
      const practice = practiceMap.get(Number(q.practice_id)) || practiceMap.get(q.practice_id);
      if (!practice?.email) continue;
      // Use recorded sender from first touchpoint if available; else fallback to CRON_SENDER_EMAIL
      const finalSenderEmail = q.sender_email || senderEmail;
      const finalSenderName = senderNameByEmail[finalSenderEmail] || senderName;
      entries.push({
        id: `cron-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        recipientEmail: practice.email,
        recipientName: practice.first_name || practice.practice_name || practice.owner_name || 'N/A',
        templateId: q.template_id,
        senderEmail: finalSenderEmail,
        senderName: finalSenderName,
        senderPassword: 'N/A',
        sendMode: 'send',
        scheduledDate: null,
        emailCount: practice.email_sent_count || 0,
        entryData: {
          id: practice.id,
          practice_name: practice.practice_name,
          domain_url: practice.domain_url,
          owner_name: practice.owner_name,
          email: practice.email,
          phone_number: practice.phone_number,
          first_name: practice.first_name,
          campaign_id: q.campaign_id,
          touch_key: q.touch_key,
        },
        status: 'pending',
      });
    }

    if (entries.length === 0) {
      return NextResponse.json({ success: true, queued: 0, message: 'No valid entries to queue' });
    }

    const { error: insertError } = await supabase.from('email_queue').insert(
      entries.map((e) => ({
        id: e.id,
        recipient_email: e.recipientEmail,
        recipient_name: e.recipientName,
        template_id: e.templateId,
        sender_email: e.senderEmail,
        sender_name: e.senderName,
        sender_password: e.senderPassword,
        send_mode: e.sendMode,
        scheduled_date: e.scheduledDate,
        email_count: e.emailCount || 0,
        entry_data: e.entryData || {},
        status: 'pending',
      }))
    );

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to insert email queue', details: insertError.message },
        { status: 500 }
      );
    }

    // Processing of email queue is manual for now - do not auto-trigger processEmailQueue
    // if (baseUrl && entries.length > 0) {
    //   try {
    //     await fetch(`${baseUrl}/api/processEmailQueue`, {
    //       method: 'POST',
    //       headers: { 'x-cron-secret': process.env.CRON_SECRET || '' },
    //     });
    //   } catch (e) {
    //     console.error('[campaign-progression] processEmailQueue error:', e);
    //   }
    // }

    return NextResponse.json({
      success: true,
      queued: entries.length,
      message: `Queued ${entries.length} next-touchpoint emails`,
    });
  } catch (err) {
    console.error('[campaign-progression]', err);
    return NextResponse.json(
      { error: err.message || 'Campaign progression failed' },
      { status: 500 }
    );
  }
}
