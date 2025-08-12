// src/app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { stripe } from '@/lib/stripe'; // use helper that instantiates Stripe
import { PLANS } from '@/lib/billing';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Which plan?
    const { planKey } = (await req.json()) as { planKey?: string };
    const plan = planKey ? PLANS[planKey as keyof typeof PLANS] : undefined;
    if (!plan?.priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    // Ensure Stripe customer on profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    // Build session depending on plan mode (subscription vs one-time)
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=success`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pricing?status=cancelled`;

    const isSubscription = plan.mode === 'subscription';

    const session = await stripe.checkout.sessions.create({
      mode: isSubscription ? 'subscription' : 'payment',
      customer: customerId!,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { supabase_user_id: user.id, plan_key: planKey! },
      ...(isSubscription
        ? {
            subscription_data: {
              metadata: { supabase_user_id: user.id, plan_key: planKey! },
            },
          }
        : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('checkout error', e?.message || e);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
