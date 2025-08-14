// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'; // needed for signature verification with req.text()

// ---- Setup ----
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any });

const ADMIN = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// LIVE price IDs from env
const STARTER_PRICE_ID = process.env.STARTER_PRICE_ID;
const PREMIUM_PRICE_ID = process.env.PREMIUM_PRICE_ID;
const COINS_PRICE_ID   = process.env.COINS_PRICE_ID;

// Credits config
const STARTER_MONTHLY_CREDITS = Number(process.env.STARTER_MONTHLY_CREDITS ?? 25);
const PREMIUM_MONTHLY_CREDITS = Number(process.env.PREMIUM_MONTHLY_CREDITS ?? 0);
const COINS_CREDITS           = Number(process.env.COINS_CREDITS ?? 15);

// ---- Helpers ----
async function creditLedger(userId, delta, reason, externalId, metadata = null) {
  await ADMIN.from('credit_ledger').insert({
    user_id: userId,
    delta,
    reason,
    external_id: externalId, // idempotent key (Stripe event id)
    metadata,
  });
}

async function upsertSubscriptionRow({
  userId,
  plan,
  status,
  stripeCustomerId,
  stripeSubscriptionId,
  currentPeriodEnd,
}) {
  if (!userId) return;
  await ADMIN.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: plan ?? null,
      status: status ?? null,
      stripe_customer_id: stripeCustomerId ?? null,
      stripe_subscription_id: stripeSubscriptionId ?? null,
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    return NextResponse.json({ error: `Bad signature: ${e.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ----------------- COINS & initial subscription checkout -----------------
      case 'checkout.session.completed': {
        const s: any = event.data.object;

        const userId =
          s?.metadata?.user_id || s?.client_reference_id || null;
        const sku = String(s?.metadata?.sku || '').toLowerCase();
        const credits = Number(s?.metadata?.credits || 0);

        if (s?.mode === 'payment' && userId && credits > 0) {
          // One-time coins purchase
          await creditLedger(userId, credits, 'stripe_purchase', event.id, {
            session_id: s?.id,
            sku,
          });
        }

        if (s?.mode === 'subscription' && userId) {
          // Create a basic row now; invoice/subscription.updated refine it later
          const plan = sku === 'starter' ? 'starter' : sku === 'premium' ? 'premium' : null;
          await upsertSubscriptionRow({
            userId,
            plan,
            status: 'active',
            stripeCustomerId: String(s?.customer || ''),
            stripeSubscriptionId: String(s?.subscription || ''),
            currentPeriodEnd: null,
          });
        }
        break;
      }

      // ----------------- Subscription invoices (monthly credits) -----------------
      case 'invoice.payment_succeeded': {
        const inv: any = event.data.object;

        const line = inv?.lines?.data?.[0] || {};
        const priceId = line?.price?.id || null;
        const plan =
          priceId === STARTER_PRICE_ID ? 'starter' :
          priceId === PREMIUM_PRICE_ID ? 'premium' : null;

        const subId = String(inv?.subscription || '') || null;

        let userId: string | null = null;
        let periodEnd: number | null = null;

        if (subId) {
          const sub: any = await stripe.subscriptions.retrieve(subId);
          userId = sub?.metadata?.user_id || null;
          periodEnd = (sub?.current_period_end ?? null) ? sub.current_period_end * 1000 : null;

          await upsertSubscriptionRow({
            userId,
            plan,
            status: sub?.status || null,
            stripeCustomerId: String(sub?.customer || ''),
            stripeSubscriptionId: sub?.id || null,
            currentPeriodEnd: periodEnd,
          });
        }

        if (userId && plan) {
          const grant = plan === 'starter' ? STARTER_MONTHLY_CREDITS : PREMIUM_MONTHLY_CREDITS;
          if (grant > 0) {
            await creditLedger(userId, grant, 'stripe_subscription_monthly_credit', event.id, {
              invoice_id: inv?.id,
              subscription_id: subId,
              plan,
            });
          }
        }
        break;
      }

      // ----------------- Keep subscription row in sync -----------------
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub: any = event.data.object;

        const itemPriceId = sub?.items?.data?.[0]?.price?.id || null;
        const plan =
          itemPriceId === STARTER_PRICE_ID ? 'starter' :
          itemPriceId === PREMIUM_PRICE_ID ? 'premium' : null;

        await upsertSubscriptionRow({
          userId: sub?.metadata?.user_id || null,
          plan,
          status: sub?.status || null,
          stripeCustomerId: String(sub?.customer || ''),
          stripeSubscriptionId: sub?.id || null,
          currentPeriodEnd: (sub?.current_period_end ?? null) ? sub.current_period_end * 1000 : null,
        });
        break;
      }

      default:
        // ignore other events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'webhook error' }, { status: 500 });
  }
}
