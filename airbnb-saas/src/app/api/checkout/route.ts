import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json(); // { priceId: string, mode?: 'payment'|'subscription', successPath?, cancelPath? }
    const priceId = body?.priceId as string | undefined;
    const mode = (body?.mode as 'payment'|'subscription'|undefined) ?? 'payment';
    const successPath = body?.successPath || '/dashboard?purchase=success';
    const cancelPath = body?.cancelPath || '/pricing?canceled=1';
    if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });

    // ensure stripe customer id
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id as string | null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase.from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId!,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}${successPath}`,
      cancel_url: `${SITE_URL}${cancelPath}`,
      metadata: { user_id: user.id }, // used by webhook
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error('checkout error', e?.message);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
