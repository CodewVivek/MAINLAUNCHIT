import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

async function fetchSubscriptionFromDodo(subscriptionId) {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey || !subscriptionId) return null;
  const baseUrl = process.env.DODO_PAYMENTS_API_URL || 'https://api.dodopayments.com';
  try {
    const res = await fetch(`${baseUrl}/v1/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      return null;
    }
    const body = await res.json();
    const sub = body?.data ?? body?.subscription ?? body;
    const customerId = sub?.customer_id ?? sub?.customer?.customer_id ?? sub?.customer_id ?? null;
    return customerId ? String(customerId) : null;
  } catch (err) {
    return null;
  }
}

/**
 * GET /api/customer-portal-link
 * Returns the Dodo customer portal URL for the current user's subscription.
 * If dodo_customer_id is missing, fetches it from Dodo using subscription_id and saves it.
 */
export async function GET(request) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Case-insensitive paid plan filter so Showcase/showcase/SHOWCASE all match
    const paidPlanFilter = 'plan_type.ilike.showcase,plan_type.ilike.spotlight';
    // Prefer active/trialing/on_hold; fallback to any Showcase/Spotlight (DB may have null or other status)
    const { data: projectActive, error: projectError } = await supabase
      .from('projects')
      .select('id, dodo_customer_id, subscription_id, plan_type, subscription_status')
      .eq('user_id', user.id)
      .or(paidPlanFilter)
      .in('subscription_status', ['active', 'trialing', 'on_hold'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (projectError) {
      return NextResponse.json({ error: 'Failed to load subscription' }, { status: 500 });
    }

    let project = projectActive ?? null;
    if (!project) {
      const { data: anyPaid } = await supabase
        .from('projects')
        .select('id, dodo_customer_id, subscription_id, plan_type, subscription_status')
        .eq('user_id', user.id)
        .or(paidPlanFilter)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      project = anyPaid ?? null;
    }

    if (!project) {
      return NextResponse.json({ error: 'No subscription found. Please purchase a plan first.' }, { status: 404 });
    }

    let customerId = project.dodo_customer_id ?? null;

    if (!customerId && project.subscription_id) {
      customerId = await fetchSubscriptionFromDodo(project.subscription_id);
      if (customerId) {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        await admin.from('projects').update({ dodo_customer_id: customerId }).eq('id', project.id).eq('user_id', user.id);
      }
    }

    if (!customerId) {
      return NextResponse.json({
        error: 'Could not resolve billing portal. Your subscription may still be processing. Please try again in a few minutes or contact support if the issue persists.'
      }, { status: 502 });
    }

    const origin = request.nextUrl?.origin || '';
    const url = `${origin}/customer-portal?customer_id=${encodeURIComponent(customerId)}`;
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong. Please try again later.' }, { status: 500 });
  }
}
