import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';

/**
 * POST /api/cancel-subscription
 * Sets the user's subscription to cancel at period end (no "cancel now").
 * User keeps paid access until current_period_end; no charge next cycle.
 */
export async function POST() {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paidPlanFilter = 'plan_type.ilike.showcase,plan_type.ilike.spotlight';
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, subscription_id, subscription_status, cancel_at_period_end')
      .eq('user_id', user.id)
      .or(paidPlanFilter)
      .in('subscription_status', ['active', 'trialing', 'on_hold'])
      .not('subscription_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (projectError) {
      return NextResponse.json({ error: 'Failed to load subscription' }, { status: 500 });
    }
    if (!project) {
      return NextResponse.json({ error: 'No active subscription found to cancel.' }, { status: 404 });
    }
    if (project.cancel_at_period_end) {
      return NextResponse.json({ error: 'Subscription is already set to cancel at the end of the billing period.' }, { status: 400 });
    }

    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const baseUrl = process.env.DODO_PAYMENTS_API_URL || 'https://api.dodopayments.com';
    if (!apiKey) {
      return NextResponse.json({ error: 'Billing configuration error.' }, { status: 500 });
    }

    const res = await fetch(`${baseUrl}/v1/subscriptions/${project.subscription_id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancel_at_period_end: true }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errBody?.message || errBody?.error || 'Could not update subscription. Try again or use the billing portal.' },
        { status: res.status >= 500 ? 502 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "You'll keep your plan until the end of your current billing period. We won't charge you again after that.",
    });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}
