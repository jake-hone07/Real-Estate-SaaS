import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { stripe } from '@/lib/stripe';
import { PLANS } from '@/lib/billing';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

type PlanKey = keyof typeof PLANS;

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Plan
  const { planKey } = (await req.json().catch(() => ({}))) as { planKey?: PlanKey };
  const plan = planKey ? PLANS[planKey] : undefined;
  if (!plan?.priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  // Load saved customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single();

  let customerId = (profile?.stripe_customer_id ?? null) as string | null;

  // Try to use it in THIS Stripe mode; if it 404s (wrong mode), we’ll create a new one
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId);
    } catch {
      customerId = null; // force new test/live customer
    }
  }

  // Create & persist a new customer if needed
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? profile?.email ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  const isSubscription = plan.mode === 'subscription';
  const base = APP_URL || new URL(req.url).origin;
  const successUrl = `${base}/dashboard?purchase=success`;
  const cancelUrl = `${base}/pricing?canceled=1`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      metadata: { supabase_user_id: user.id, plan_key: String(planKey) },
      ...(customerId ? { customer: customerId } : {}),
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: { supabase_user_id: user.id, plan_key: String(planKey) },
            },
          }
        : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout session error:', err);
    const message =
      err?.type === 'StripeInvalidRequestError' ? `Stripe error: ${err.message}` : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
