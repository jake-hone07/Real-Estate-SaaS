// src/app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';
import { getPlan } from '@/lib/billing';

// Instantiate once per process
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = (await req.json()) as { planKey?: string };
    const resolved = getPlan(body?.planKey);
    if (!resolved) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    const { key: planKey, def: plan } = resolved;

    // Ensure Stripe customer
    const { data: prof } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    let customerId = prof?.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: plan.mode === 'subscription' ? 'subscription' : 'payment',
      customer: customerId!,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      success_url: `${APP_URL}/dashboard?purchase=success`,
      cancel_url: `${APP_URL}/pricing?canceled=1`,
      metadata: { supabase_user_id: user.id, plan_key: planKey },
      ...(plan.mode === 'subscription'
        ? {
            subscription_data: {
              metadata: { supabase_user_id: user.id, plan_key: planKey },
            },
          }
        : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('checkout error:', e?.message || e);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
