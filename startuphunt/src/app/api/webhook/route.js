import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Service Role Client for Admin Operations (Bypass RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request) {
    try {
        // 1. Signature Verification
        const signature = request.headers.get('x-dodo-signature');
        const rawBody = await request.text();

        if (!process.env.DODO_WEBHOOK_SECRET) {
            console.error('DODO_WEBHOOK_SECRET missing');
            return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', process.env.DODO_WEBHOOK_SECRET)
            .update(rawBody)
            .digest('hex');

        if (!signature || signature.toLowerCase() !== expectedSignature.toLowerCase()) {
            console.error('Invalid Webhook Signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const { event, data } = payload;

        console.log(`Received Secured Webhook: ${event}`);

        // 2. Idempotency Check
        const webhookId = data.id || data.event_id || payload.id;
        if (webhookId) {
            const { data: existing } = await supabaseAdmin
                .from('webhook_events')
                .select('id')
                .eq('webhook_id', webhookId)
                .single();

            if (existing) {
                console.log(`Duplicate webhook skipped: ${webhookId}`);
                return NextResponse.json({ received: true, duplicate: true });
            }
        }

        // 3. Process Event
        if (['subscription.created', 'subscription.updated', 'order.paid'].includes(event)) {
            const metadata = data.metadata || {};
            const userId = metadata.userId;
            const planType = metadata.planType;
            const projectId = metadata.projectId; // Safer target
            const subscriptionId = data.subscription_id || data.id;

            if (!userId || !planType) {
                console.error('Missing metadata in webhook');
                return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
            }

            // Update Database (Using Service Role for Permission Bypass)
            // Ideally target by projectId AND userId for maximum safety if projectId is available
            let query = supabaseAdmin
                .from('projects')
                .update({
                    plan_type: planType,
                    seo_status: 'active',
                    is_featured: true,
                    subscription_id: subscriptionId,
                    subscription_status: data.status || 'active',
                    current_period_end: data.current_period_end,
                    cancel_at_period_end: data.cancel_at_period_end || false
                });

            if (!projectId) {
                return NextResponse.json({ error: 'Missing projectId in webhook metadata' }, { status: 400 });
            }

            query = query.eq('id', projectId).eq('user_id', userId);

            const { error } = await query;

            if (error) {
                console.error('Database update error:', error);
                // Don't throw error to Dodo to avoid re-tries if it's a logic error, but here likely retry is good
                throw error;
            }

            console.log(`Successfully updated project via webhook for user ${userId} -> ${planType}`);
        }

        // 4. Mark as Processed
        if (webhookId) {
            await supabaseAdmin.from('webhook_events').insert({
                webhook_id: webhookId,
                event_type: event
            });
        }

        return NextResponse.json({ received: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
