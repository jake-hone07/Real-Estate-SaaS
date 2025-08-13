// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // never cache webhooks

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const stripe = new Stripe(mustEnv('STRIPE_SECRET_KEY'));

// Admin (service-role) client since webhooks run without a user session
const admin = createClient(
  mustEnv('NEXT_PUBLIC_SUPABASE_URL'),
  mustEnv('SUPABASE_SERVICE_ROLE_KEY')
);

// credits per plan key (adjust to your plans)
const PLAN_CREDITS: Record<string, number> = {
  Starter: 50,
  Premium: 200,
};

async function grantCredits(userId: string, planKey: string, invoiceId?: string) {
  const credits = PLAN_CREDITS[planKey] ?? 0;
  if (!credits) return;

  const { error } = await admin.from('credits_ledger').insert({
    user_id: userId,
    delta: credits,
    reason: `purchase:${planKey}`,
    stripe_invoice_id: invoiceId ?? null,
  });
  if (error) console.error('[webhook] grantCredits error:', error.message);
}

export async function POST(req: Request) {
  // --- Signature ---
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    console.error('[webhook] missing signature or STRIPE_WEBHOOK_SECRET');
    return NextResponse.json({ received: true }, { status: 400 });
  }

  // --- Construct event with raw body ---
  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e: any) {
    console.error('[webhook] constructEvent error:', e?.message || e);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.supabase_user_id;
        const planKey = s.metadata?.plan_key;
        if (!userId || !planKey) break;

        // mirror plan to profile (optional for one-time)
        await admin.from('profiles').update({ plan_key: planKey }).eq('id', userId);

        // one-time: grant immediately
        if (s.mode === 'payment') {
          await grantCredits(userId, planKey, (s.invoice as string) ?? undefined);
        }

        // subscription: persist sub mapping
        if (s.mode === 'subscription' && s.subscription) {
          const subId =
            typeof s.subscription === 'string' ? s.subscription : s.subscription.id;
          await admin.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_subscription_id: subId,
              plan_key: planKey,
              status: 'active', // corrected by sub.updated
            },
            { onConflict: 'stripe_subscription_id' }
          );
        }
        break;
      }

      case 'invoice.paid': {
        // Recurring credit top-ups for subscriptions
        const invoice = event.data.object as Stripe.Invoice;
        const subId = (invoice as any).subscription as string | null | undefined;
        if (!subId) break;

        const { data: subRow } = await admin
          .from('subscriptions')
          .select('user_id, plan_key')
          .eq('stripe_subscription_id', subId)
          .maybeSingle();

        if (subRow?.user_id && subRow?.plan_key) {
          await grantCredits(subRow.user_id, subRow.plan_key, invoice.id);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        // get Stripe customer id
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        // retrieve customer to read supabase_user_id we stored earlier
        const cust = await stripe.customers.retrieve(customerId);
        const userId =
          typeof cust !== 'string' && 'metadata' in cust
            ? (cust as any)?.metadata?.supabase_user_id
            : undefined;
        if (!userId) break;

        // plan key (if you attach metadata on price/subscription)
        const planKey = (sub.metadata?.plan_key as string | undefined) ?? undefined;

        // normalize current period end
        const cpeUnix = (sub as any).current_period_end as number | undefined;
        const cpeIso = cpeUnix ? new Date(cpeUnix * 1000).toISOString() : null;

        const payload: any = {
          user_id: userId,
          stripe_subscription_id: sub.id,
          status: sub.status,
        };
        if (planKey) payload.plan_key = planKey;
        if (cpeIso) payload.current_period_end = cpeIso;

        await admin
          .from('subscriptions')
          .upsert(payload, { onConflict: 'stripe_subscription_id' });

        if (planKey) {
          await admin.from('profiles').update({ plan_key: planKey }).eq('id', userId);
        }
        break;
      }

      default:
        // no-op
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    console.error('[webhook] handler error:', e?.message || e);
    // acknowledge to prevent Stripe retry storms
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
