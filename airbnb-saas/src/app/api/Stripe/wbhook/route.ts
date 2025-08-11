// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { creditsForPrice } from '@/lib/billing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = headers().get('stripe-signature')!;
  let evt: Stripe.Event;

  try {
    evt = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (e: any) {
    console.error('Webhook signature failed', e.message);
    return new NextResponse('Bad signature', { status: 400 });
  }

  // subscription activated or renewed
  if (evt.type === 'invoice.payment_succeeded') {
    const invoice = evt.data.object as Stripe.Invoice;
    const sub = invoice.lines?.data?.[0]?.subscription as string | undefined;
    const priceId = invoice.lines?.data?.[0]?.price?.id;
    const credits = creditsForPrice(priceId ?? '');

    if (credits > 0 && sub) {
      // we stored supabase_user_id on subscription metadata in checkout
      const subscription = await stripe.subscriptions.retrieve(sub);
      const userId = (subscription.metadata?.supabase_user_id || invoice.customer_email) as string | undefined;
      if (!userId) return NextResponse.json({ ok: true });

      // add (or reset) credits — choose your policy
      // Here we ADD credits each billing period:
      await supabase.rpc('add_credits', { p_user_id: userId, p_amount: credits });
      // If you prefer reset each month, do: update profiles set credits = creditsForPrice(priceId)

      console.log(`Granted ${credits} credits to ${userId}`);
    }
  }

  return NextResponse.json({ received: true });
}
