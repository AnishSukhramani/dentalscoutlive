import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/campaigns/[id]/metrics
// Returns one row per practice included in this campaign with send/reply status.
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // 1a) Sends explicitly linked to this campaign (campaign_id set at send time)
    const { data: sendsByCampaign, error: sendsError } = await supabase
      .from('outbound_message_tracking')
      .select('practice_id')
      .eq('campaign_id', id);

    if (sendsError) {
      console.error('Error fetching outbound_message_tracking for campaign metrics:', sendsError);
      return NextResponse.json({ error: 'Failed to load campaign metrics' }, { status: 500 });
    }

    // 1b) Fallback: sends that used a template linked to this campaign (campaign_id may be null)
    let templateIdsForCampaign = [];
    try {
      const { data: campaignTemplates } = await supabase
        .from('email_templates')
        .select('id')
        .eq('campaign_id', id);
      if (campaignTemplates && campaignTemplates.length > 0) {
        templateIdsForCampaign = campaignTemplates.map((t) => t.id).filter(Boolean);
      }
    } catch (e) {
      // email_templates may not have campaign_id column; ignore
    }

    // 1c) Also include templates linked via touchpoint template_id (campaign touchpoints)
    if (templateIdsForCampaign.length === 0) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('touchpoints')
        .eq('id', id)
        .single();
      const touchpointTemplateIds = (campaign?.touchpoints || [])
        .map((tp) => tp.template_id)
        .filter(Boolean);
      if (touchpointTemplateIds.length > 0) {
        const { data: linkedTemplates } = await supabase
          .from('email_templates')
          .select('id')
          .in('template_id', touchpointTemplateIds);
        if (linkedTemplates?.length) {
          templateIdsForCampaign = linkedTemplates.map((t) => t.id).filter(Boolean);
        }
      }
    }

    let sendsByTemplate = [];
    if (templateIdsForCampaign.length > 0) {
      const { data: sendsTemplate } = await supabase
        .from('outbound_message_tracking')
        .select('practice_id')
        .in('template_id', templateIdsForCampaign);
      sendsByTemplate = sendsTemplate || [];
    }

    const allSends = [...(sendsByCampaign || []), ...sendsByTemplate];
    if (allSends.length === 0) {
      return NextResponse.json({ rows: [] });
    }

    const practiceIds = Array.from(new Set(allSends.map((s) => s.practice_id).filter(Boolean)));

    if (practiceIds.length === 0) {
      return NextResponse.json({ rows: [] });
    }

    // 2) Fetch basic practice info for those practices
    const { data: practices, error: practicesError } = await supabase
      .from('practices')
      .select('id, email, first_name, practice_name')
      .in('id', practiceIds);

    if (practicesError) {
      console.error('Error fetching practices for campaign metrics:', practicesError);
      return NextResponse.json({ error: 'Failed to load campaign metrics' }, { status: 500 });
    }

    // 3) Fetch reply tokens for this campaign + these practices
    const { data: tokens, error: tokensError } = await supabase
      .from('campaign_reply_tokens')
      .select('practice_id, touch_key, replied_at')
      .eq('campaign_id', id)
      .in('practice_id', practiceIds);

    if (tokensError) {
      console.error('Error fetching campaign_reply_tokens:', tokensError);
      return NextResponse.json({ error: 'Failed to load campaign metrics' }, { status: 500 });
    }

    const sendCountByPractice = new Map();
    allSends.forEach((s) => {
      const pid = s.practice_id;
      if (!pid) return;
      sendCountByPractice.set(pid, (sendCountByPractice.get(pid) || 0) + 1);
    });

    const tokensByPractice = new Map();
    (tokens || []).forEach((t) => {
      const pid = t.practice_id;
      if (!pid) return;
      if (!tokensByPractice.has(pid)) {
        tokensByPractice.set(pid, []);
      }
      tokensByPractice.get(pid).push(t);
    });

    // Build UUID -> touch_key (tp1, tp2) from campaign touchpoints for human-readable labels
    let templateIdToTouchKey = new Map();
    try {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('touchpoints')
        .eq('id', id)
        .single();
      (campaign?.touchpoints || []).forEach((tp) => {
        if (tp.template_id && tp.touch_key) {
          templateIdToTouchKey.set(tp.template_id, tp.touch_key);
        }
      });
    } catch (e) {
      // ignore
    }

    const formatTouchpointLabel = (key) => {
      if (!key) return '';
      if (key.startsWith('tp')) {
        const n = parseInt(key.slice(2), 10);
        if (!Number.isNaN(n)) return `Touchpoint ${n}`;
      }
      return key;
    };

    const rows = (practices || []).map((p) => {
      const sentCount = sendCountByPractice.get(p.id) || 0;
      const practiceTokens = tokensByPractice.get(p.id) || [];
      const hasReplied = practiceTokens.length > 0;

      const replyTouchKeysSet = new Set();
      let firstReplyAt = null;

      practiceTokens.forEach((t) => {
        if (t.touch_key) replyTouchKeysSet.add(t.touch_key);
        if (t.replied_at) {
          const ts = new Date(t.replied_at).toISOString();
          if (!firstReplyAt || ts < firstReplyAt) {
            firstReplyAt = ts;
          }
        }
      });

      const replyTouchKeys = Array.from(replyTouchKeysSet);
      const replyTouchpointLabels = replyTouchKeys.map((key) => {
        const touchKey = templateIdToTouchKey.get(key) || key;
        return formatTouchpointLabel(touchKey);
      }).filter(Boolean);

      return {
        practice_id: p.id,
        email: p.email,
        first_name: p.first_name,
        practice_name: p.practice_name,
        sent_count: sentCount,
        has_replied: hasReplied,
        reply_touch_keys: replyTouchKeys,
        reply_touchpoint_labels: replyTouchpointLabels,
        first_reply_at: firstReplyAt,
      };
    });

    return NextResponse.json({ rows });
  } catch (error) {
    console.error('Error in GET /api/campaigns/[id]/metrics:', error);
    return NextResponse.json({ error: 'Failed to load campaign metrics' }, { status: 500 });
  }
}

