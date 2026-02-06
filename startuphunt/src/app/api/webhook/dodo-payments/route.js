import { NextResponse } from 'next/server';
import { Webhooks } from '@dodopayments/nextjs';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    // Don't crash builds: fail at request-time with a clear error.
    throw new Error('Missing Supabase admin env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function mapPlanToProjectUpdate(plan) {
  if (plan === 'Spotlight' || plan === 'spotlight') {
    return { plan_type: 'Spotlight', seo_status: 'active', is_featured: true, is_sponsored: true, sponsored_tier: 'premium' };
  }
  if (plan === 'Showcase' || plan === 'showcase') {
    return { plan_type: 'Showcase', seo_status: 'active', is_featured: false, is_sponsored: true, sponsored_tier: 'highlight' };
  }
  return null;
}

/**
 * Fetch subscription details from Dodo API so we can store current_period_end, customer_id, etc.
 * Called when webhook payload doesn't include period end (e.g. payment.succeeded).
 * Returns { current_period_end, customer_id, status, cancel_at_period_end } or null.
 */
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
    if (!res.ok) return null;
    const body = await res.json();
    const sub = body?.data ?? body?.subscription ?? body;
    // Dodo docs: next_billing_date is when the next charge runs (https://docs.dodopayments.com/features/subscription)
    const currentPeriodEnd =
      sub?.next_billing_date ??
      sub?.current_period_end ??
      sub?.current_period_end_date ??
      sub?.end_date ??
      sub?.period_end ??
      null;
    const customerId = sub?.customer_id ?? sub?.customer?.customer_id ?? sub?.customer_id ?? null;
    const status = sub?.status ?? null;
    const cancelAtPeriodEnd = sub?.cancel_at_period_end ?? sub?.cancel_at_period_end ?? false;
    return {
      current_period_end: currentPeriodEnd ? (typeof currentPeriodEnd === 'string' ? currentPeriodEnd : null) : null,
      customer_id: customerId,
      status,
      cancel_at_period_end: !!cancelAtPeriodEnd,
    };
  } catch {
    return null;
  }
}

/** Idempotency: record webhook event; returns true if first time, false if duplicate. */
async function recordWebhookEvent(payload, eventType) {
  const supabaseAdmin = getSupabaseAdmin();
  const data = payload?.data ?? payload;
  const meta = data?.metadata ?? payload?.metadata ?? {};
  const webhookId =
    data?.payment_id ||
    data?.subscription_id ||
    payload?.id ||
    payload?.event_id ||
    (data?.subscription_id && meta?.projectId
      ? `dodo-${eventType}-${data.subscription_id}-${meta.projectId}`
      : null);
  if (!webhookId) return true;
  const { error } = await supabaseAdmin.from('webhook_events').insert({
    webhook_id: String(webhookId),
    event_type: eventType,
  });
  if (error) {
    if (error.code === '23505') return false; // unique violation = duplicate
    throw error;
  }
  return true;
}

function createDodoWebhookHandler() {
  const webhookKey = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookKey) {
    // Don't crash builds: fail at request-time with a clear error.
    throw new Error('Missing DODO_WEBHOOK_SECRET.');
  }

  return Webhooks({
    webhookKey,

    onPayload: async () => { },

    onPaymentSucceeded: async (payload) => {
      const alreadyProcessed = !(await recordWebhookEvent(payload, 'payment_succeeded'));
      if (alreadyProcessed) return;

      const supabaseAdmin = getSupabaseAdmin();
      const data = payload?.data ?? payload;
      const meta = data?.metadata ?? payload?.metadata ?? {};
      const plan = meta?.planType || meta?.plan;
      const userId = meta?.userId;
      const projectIdRaw = meta?.projectId;
      const projectId = projectIdRaw != null ? parseInt(String(projectIdRaw), 10) : null;
      if (!plan || !userId || projectId == null || Number.isNaN(projectId)) return;

      const update = mapPlanToProjectUpdate(plan);
      if (!update) return;

      const subscriptionId =
        data?.subscription_id ?? payload?.subscription_id ?? payload?.subscriptionId ?? payload?.subscription?.id;
      let currentPeriodEnd =
        data?.next_billing_date ??
        payload?.next_billing_date ??
        data?.current_period_end ??
        payload?.current_period_end ??
        payload?.currentPeriodEnd ??
        payload?.subscription?.current_period_end ??
        data?.subscription?.current_period_end ??
        payload?.subscription?.next_billing_date ??
        data?.subscription?.next_billing_date;
      // For payment.succeeded, the subscription is active (not "succeeded" which is a payment status)
      let status = 'active';
      let cancelAtPeriodEnd = data?.cancel_at_period_end ?? payload?.cancel_at_period_end ?? payload?.cancelAtPeriodEnd ?? false;
      let dodoCustomerId = data?.customer?.customer_id ?? payload?.customer?.customer_id ?? payload?.data?.customer?.customer_id ?? null;

      if (subscriptionId && !currentPeriodEnd) {
        const fromApi = await fetchSubscriptionFromDodo(subscriptionId);
        if (fromApi) {
          if (fromApi.current_period_end) currentPeriodEnd = fromApi.current_period_end;
          if (fromApi.customer_id) dodoCustomerId = dodoCustomerId ?? fromApi.customer_id;
          if (fromApi.status) status = fromApi.status;
          if (fromApi.cancel_at_period_end !== undefined) cancelAtPeriodEnd = fromApi.cancel_at_period_end;
        }
      }

      const { data: updated, error } = await supabaseAdmin
        .from('projects')
        .update({
          ...update,
          subscription_id: subscriptionId ?? null,
          subscription_status: status,
          current_period_end: currentPeriodEnd ?? null,
          cancel_at_period_end: cancelAtPeriodEnd,
          dodo_customer_id: dodoCustomerId,
        })
        .eq('id', projectId)
        .eq('user_id', userId)
        .select('id');

      if (error) throw error;
      if (!updated?.length) throw new Error('Project not found or user mismatch');
    },

    onSubscriptionOnHold: async (payload) => {
      const alreadyProcessed = !(await recordWebhookEvent(payload, 'subscription_on_hold'));
      if (alreadyProcessed) return;

      const supabaseAdmin = getSupabaseAdmin();
      const data = payload?.data ?? payload;
      const meta = data?.metadata ?? payload?.metadata ?? {};
      const userId = meta?.userId;
      const projectIdRaw = meta?.projectId;
      const projectId = projectIdRaw != null ? parseInt(String(projectIdRaw), 10) : null;
      if (!userId || projectId == null || Number.isNaN(projectId)) return;

      const { data: updated, error } = await supabaseAdmin
        .from('projects')
        .update({
          subscription_status: 'on_hold',
          seo_status: 'inactive',
          is_featured: false,
          is_sponsored: false,
          sponsored_tier: null,
        })
        .eq('id', projectId)
        .eq('user_id', userId)
        .select('id');

      if (error) throw error;
      if (!updated?.length) throw new Error('Project not found or user mismatch');
    },

    onSubscriptionCancelled: async (payload) => {
      const alreadyProcessed = !(await recordWebhookEvent(payload, 'subscription_cancelled'));
      if (alreadyProcessed) return;

      const supabaseAdmin = getSupabaseAdmin();
      const data = payload?.data ?? payload;
      const meta = data?.metadata ?? payload?.metadata ?? {};
      const userId = meta?.userId;
      const projectIdRaw = meta?.projectId;
      const projectId = projectIdRaw != null ? parseInt(String(projectIdRaw), 10) : null;
      if (!userId || projectId == null || Number.isNaN(projectId)) return;

      const { data: updated, error } = await supabaseAdmin
        .from('projects')
        .update({
          subscription_status: 'cancelled',
          cancel_at_period_end: true,
        })
        .eq('id', projectId)
        .eq('user_id', userId)
        .select('id');

      if (error) throw error;
      if (!updated?.length) throw new Error('Project not found or user mismatch');
    },

    onSubscriptionExpired: async (payload) => {
      const alreadyProcessed = !(await recordWebhookEvent(payload, 'subscription_expired'));
      if (alreadyProcessed) return;

      const supabaseAdmin = getSupabaseAdmin();
      const data = payload?.data ?? payload;
      const meta = data?.metadata ?? payload?.metadata ?? {};
      const userId = meta?.userId;
      const projectIdRaw = meta?.projectId;
      const projectId = projectIdRaw != null ? parseInt(String(projectIdRaw), 10) : null;
      if (!userId || projectId == null || Number.isNaN(projectId)) return;

      // Period has ended — downgrade to Free so placement and UI reflect no active plan.
      const { data: updated, error } = await supabaseAdmin
        .from('projects')
        .update({
          plan_type: 'Free',
          seo_status: 'inactive',
          is_featured: false,
          is_sponsored: false,
          sponsored_tier: null,
          subscription_status: 'expired',
        })
        .eq('id', projectId)
        .eq('user_id', userId)
        .select('id');

      if (error) throw error;
      if (!updated?.length) throw new Error('Project not found or user mismatch');
    },
  });
}

export async function POST(request) {
  try {
    const handler = createDodoWebhookHandler();
    return handler(request);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Webhook handler error' },
      { status: 500 }
    );
  }
}

// Optional: block other methods explicitly
export async function GET() {
  return NextResponse.json({ ok: false }, { status: 405 });
}

