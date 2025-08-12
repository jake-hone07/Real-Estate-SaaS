import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// service-role client (needed in webhooks)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Price IDs from env
const COINS_PRICE_ID   = process.env.COINS_PRICE_ID!;
const STARTER_PRICE_ID = process.env.STARTER_PRICE_ID!;
const PREMIUM_PRICE_ID = process.env.PREMIUM_PRICE_ID!;

// Idempotency helpers
async function alreadyHandled(id: string) {
  const { data } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  return !!data;
}
async function markHandled(id: string) {
  await supabase.from('stripe_events').insert({ id });
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const buf = Buffer.from(await req.arrayBuffer());
  let evt: Stripe.Event;

  try {
    evt = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    console.error('Invalid webhook signature:', e?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // idempotency
  if (await alreadyHandled(evt.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (evt.type) {
      case 'checkout.session.completed': {
        const session = evt.data.object as Stripe.Checkout.Session;

        // we rely on metadata.user_id set in /api/checkout
        const user_id = session.metadata?.user_id as string | undefined;
        if (!user_id) break;

        // fetch line items so we know what price was purchased
        const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
        const priceIds = (items.data || [])
          .map(li => (li.price as Stripe.Price | null)?.id)
          .filter(Boolean) as string[];

        if (session.mode === 'payment' && priceIds.includes(COINS_PRICE_ID)) {
          // +15 credits (requires simple RPC or direct SQL function)
          await supabase.rpc('award_credits', { p_user_id: user_id, p_amount: 15, p_reason: 'coin_purchase' });
        }

        if (session.mode === 'subscription') {
          // get the subscription to identify which plan
          const subId = session.subscription as string | null;
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId);
            const priceId = sub.items.data[0]?.price?.id;

            if (priceId === STARTER_PRICE_ID) {
              await supabase.from('profiles').update({ plan: 'starter' }).eq('id', user_id);
              await supabase.rpc('award_credits', { p_user_id: user_id, p_amount: 20, p_reason: 'starter_initial' });
            } else if (priceId === PREMIUM_PRICE_ID) {
              await supabase.from('profiles').update({ plan: 'premium' }).eq('id', user_id);
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Add monthly credits for Starter, keep Premium as unlimited
        const invoice = evt.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string | null;
        if (!subId) break;

        const sub = await stripe.subscriptions.retrieve(subId);

        // get user_id either from subscription metadata or customer metadata
        let user_id = sub.metadata?.user_id as string | undefined;
        if (!user_id) {
          const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
          user_id = customer.metadata?.user_id as string | undefined;
        }
        if (!user_id) break;

        const priceId = sub.items.data[0]?.price?.id;
        if (priceId === STARTER_PRICE_ID) {
          await supabase.rpc('award_credits', { p_user_id: user_id, p_amount: 20, p_reason: 'starter_renewal' });
          await supabase.from('profiles').update({ plan: 'starter' }).eq('id', user_id);
        } else if (priceId === PREMIUM_PRICE_ID) {
          await supabase.from('profiles').update({ plan: 'premium' }).eq('id', user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = evt.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
        const user_id = customer.metadata?.user_id as string | undefined;
        if (user_id) {
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', user_id);
        }
        break;
      }
    }

    await markHandled(evt.id);
    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('Webhook handler failed:', e?.message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
