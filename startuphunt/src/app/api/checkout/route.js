import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { createCheckoutSession } from '@dodopayments/core';

const ALLOWED_PLANS = ['Showcase', 'Spotlight'];

/**
 * Secure checkout: requires auth and validates project ownership.
 * Metadata (userId, projectId, planType) is set server-side only.
 */
export async function POST(request) {
    try {
        const supabase = await createRouteHandlerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in.' },
                { status: 401 }
            );
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: 'Invalid JSON body' },
                { status: 400 }
            );
        }
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { error: 'Invalid body' },
                { status: 400 }
            );
        }

        const projectId = body.projectId ?? body.metadata?.projectId;
        const planType = body.planType ?? body.metadata?.planType ?? body.selectedPlan;

        if (!projectId || !planType) {
            return NextResponse.json(
                { error: 'Missing projectId or planType' },
                { status: 400 }
            );
        }

        const plan = String(planType).trim();
        if (!ALLOWED_PLANS.includes(plan)) {
            return NextResponse.json(
                { error: 'Invalid plan. Allowed: Showcase, Spotlight.' },
                { status: 400 }
            );
        }

        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('id, user_id, plan_type, subscription_status')
            .eq('id', projectId)
            .single();

        if (projectError || !project || project.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Project not found or you do not own it.' },
                { status: 403 }
            );
        }

        // Prevent redundant subscriptions
        const activeStatues = ['active', 'trialing'];
        const currentPlan = project.plan_type;
        const currentStatus = project.subscription_status;

        if (activeStatues.includes(currentStatus)) {
            if (currentPlan === 'Spotlight') {
                return NextResponse.json(
                    { error: 'This project is already on the Spotlight plan.' },
                    { status: 400 }
                );
            }
            if (currentPlan === 'Showcase' && plan === 'Showcase') {
                return NextResponse.json(
                    { error: 'This project is already on the Showcase plan.' },
                    { status: 400 }
                );
            }
        }

        const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
        const environment = process.env.DODO_PAYMENTS_ENVIRONMENT;

        if (!bearerToken) {
            return NextResponse.json(
                { error: 'Checkout is not configured.' },
                { status: 500 }
            );
        }

        const productId =
            plan === 'Spotlight'
                ? (process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_SPOTLIGHT || process.env.DODO_PRODUCT_ID_SPOTLIGHT)
                : (process.env.NEXT_PUBLIC_DODO_PRODUCT_ID_SHOWCASE || process.env.DODO_PRODUCT_ID_SHOWCASE);

        if (!productId) {
            return NextResponse.json(
                { error: 'Product configuration missing for this plan.' },
                { status: 500 }
            );
        }

        const metadata = {
            userId: String(user.id),
            projectId: String(projectId),
            planType: String(plan),
        };

        // Success URL: always launchit.site (homepage). Use env so we never redirect to netlify.app.
        const envReturnUrl = process.env.DODO_PAYMENTS_RETURN_URL;
        const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
        const requestedReturn = body.return_url && typeof body.return_url === 'string' ? body.return_url.trim() : null;

        let returnUrl = envReturnUrl || (appUrl || null);
        if (requestedReturn && !returnUrl) {
            try {
                const u = new URL(requestedReturn);
                if (u.origin === (request.nextUrl?.origin || '')) returnUrl = requestedReturn;
            } catch {
                // invalid URL; keep default
            }
        }
        if (!returnUrl) returnUrl = (request.nextUrl?.origin || '') + '/';

        const customer = body.customer && typeof body.customer === 'object'
            ? { email: body.customer.email || user.email, name: body.customer.name }
            : { email: user.email };

        const payload = {
            product_cart: [{ product_id: productId, quantity: 1 }],
            customer,
            return_url: returnUrl,
            metadata,
        };

        const result = await createCheckoutSession(payload, {
            bearerToken,
            environment: environment || 'test_mode',
        });

        if (!result?.checkout_url) {
            return NextResponse.json(
                { error: 'Failed to create checkout session.' },
                { status: 502 }
            );
        }

        return NextResponse.json({ checkout_url: result.checkout_url, session_id: result.session_id });
    } catch (err) {
        return NextResponse.json(
            { error: 'Checkout failed. Please try again.' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
