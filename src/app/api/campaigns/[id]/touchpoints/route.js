import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { requireAuth } from '@/lib/authApi';

/**
 * POST /api/campaigns/[id]/touchpoints
 * Adds a new touchpoint to the campaign AND creates an empty email_template linked to it.
 * One action: touchpoint + template created and connected.
 */
export async function POST(request, { params }) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const { id: campaignId } = await params;

    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('id, touchpoints')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const current = campaign.touchpoints || [];
    const n = current.length;
    const newTemplateId = crypto.randomUUID();
    const newTouchpoint = {
      touch_key: `tp${n + 1}`,
      template_id: newTemplateId,
      touch_tag_id: `camp:${campaignId}:tp${n + 1}`
    };

    const { data: updated, error: updateError } = await supabase
      .from('campaigns')
      .update({ touchpoints: [...current, newTouchpoint] })
      .eq('id', campaignId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to add touchpoint' }, { status: 500 });
    }

    // Create empty email_template linked to new touchpoint
    const { error: templateError } = await supabase.from('email_templates').insert([{
      id: crypto.randomUUID(),
      name: `Touchpoint ${n + 1}`,
      subject: '',
      body: '',
      campaign_id: campaignId,
      template_id: newTemplateId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);

    if (templateError) {
      console.error('Error creating template for touchpoint:', templateError);
      // Touchpoint was added; user can create template manually
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in POST /api/campaigns/[id]/touchpoints:', error);
    return NextResponse.json({ error: 'Failed to add touchpoint' }, { status: 500 });
  }
}
