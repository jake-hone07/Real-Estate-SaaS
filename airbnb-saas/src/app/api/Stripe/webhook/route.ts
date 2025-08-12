// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Ensure this route runs on Node, not Edge, and is never statically optimized
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'home';

// ---- Stripe ----
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// ---- Helpers ----
/** Create Supabase admin client lazily at request time (avoids build-time env access). */
function getAdminSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  // Delay importing supabase-js until runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');
  return createClient(url, key);
}

/** Tiny type-safe helper for invoice.subscription which can be string | object | null */
function extractSubIdFromInvoice(inv: Stripe.Invoice): string | null {
  const v = (inv as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  return typeof v === 'string' ? v : null;
}

/** Tiny helper for session.subscription which can be string | object | null */
function extractSubIdFromSession(sess: Stripe.Checkout.Session): string | null {
  const v = (sess as unknown as { subscription?: string | Stripe.Subscription | null }).subscription;
  return typeof v === 'string' ? v : null;
}

// Env-configured price IDs
const COINS_PRICE_ID = process.env.COINS_PRICE_ID || '';
const STARTER_PRICE_ID = process.env.STARTER_PRICE_ID || '';
const PREMIUM_PRICE_ID = process.env.PREMIUM_PRICE_ID || '';

export async function POST(req: NextRequest) {
  // Create admin client at runtime
  const supabase = getAdminSupabase();

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const raw = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(
      raw,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Stripe webhook verify failed:', msg);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // --- Idempotency guard (stripe_events table with primary key id TEXT) ---
  const { data: seen } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .maybeSingle();

  if (seen?.id) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const user_id = session.metadata?.user_id as string | undefined;
        if (!user_id) break;

        // Determine what was bought
        if (session.mode === 'payment') {
          // Fetch line items to check price id(s)
          const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
          const priceIds = (items.data || [])
            .map(li => (li.price as Stripe.Price | null)?.id)
            .filter(Boolean) as string[];

          if (COINS_PRICE_ID && priceIds.includes(COINS_PRICE_ID)) {
            // +15 credits for a coin pack purchase
            await supabase.rpc('award_credits', {
              p_user_id: user_id,
              p_amount: 15,
              p_reason: 'coin_purchase',
            });
          }
        }

        if (session.mode === 'subscription') {
          const subId = extractSubIdFromSession(session);
          if (subId) {
            const sub = await stripe.subscriptions.retrieve(subId);
            const currentPrice = sub.items.data[0]?.price?.id;

            if (currentPrice === STARTER_PRICE_ID) {
              await supabase.from('profiles').update({ plan: 'starter' }).eq('id', user_id);
              await supabase.rpc('award_credits', {
                p_user_id: user_id,
                p_amount: 20,
                p_reason: 'starter_initial',
              });
            } else if (currentPrice === PREMIUM_PRICE_ID) {
              await supabase.from('profiles').update({ plan: 'premium' }).eq('id', user_id);
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = extractSubIdFromInvoice(invoice);
        if (!subId) break;

        const sub = await stripe.subscriptions.retrieve(subId);

        // Find user_id via subscription or customer metadata
        let user_id = (sub.metadata?.user_id as string | undefined) || undefined;
        if (!user_id) {
          const cust = (await stripe.customers.retrieve(sub.customer as string)) as Stripe.Customer;
          user_id = cust.metadata?.user_id as string | undefined;
        }
        if (!user_id) break;

        const currentPrice = sub.items.data[0]?.price?.id;

        if (currentPrice === STARTER_PRICE_ID) {
          await supabase.rpc('award_credits', {
            p_user_id: user_id,
            p_amount: 20,
            p_reason: 'starter_renewal',
          });
          await supabase.from('profiles').update({ plan: 'starter' }).eq('id', user_id);
        } else if (currentPrice === PREMIUM_PRICE_ID) {
          await supabase.from('profiles').update({ plan: 'premium' }).eq('id', user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const cust = (await stripe.customers.retrieve(sub.customer as string)) as Stripe.Customer;
        const user_id = cust.metadata?.user_id as string | undefined;
        if (user_id) {
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', user_id);
        }
        break;
      }

      default:
        // ignore other events
        break;
    }

    // Mark handled (idempotency)
    await supabase.from('stripe_events').insert({ id: event.id });

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Webhook handler failed:', msg);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
