// app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function anyEnv(...names: string[]): string {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim() !== '') return v.trim();
  }
  throw new Error(`Missing env: one of [${names.join(', ')}]`);
}

const stripe = new Stripe(anyEnv('STRIPE_SECRET_KEY'));

// Service-role client (bypasses RLS). Prefer SUPABASE_URL if present.
const admin = createClient(
  anyEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'XT_PUBLIC_SUPABASE_URL'),
  anyEnv('SUPABASE_SERVICE_ROLE_KEY')
);

// credits per plan key (adjust as needed)
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
  const sig = req.headers.get('stripe-signature');
  const secret = anyEnv('STRIPE_WEBHOOK_SECRET');
  if (!sig) {
    console.error('[webhook] missing signature');
    return NextResponse.json({ received: true }, { status: 400 });
  }

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

        await admin.from('profiles').update({ plan_key: planKey }).eq('id', userId);

        if (s.mode === 'payment') {
          await grantCredits(userId, planKey, (s.invoice as string) ?? undefined);
        }

        if (s.mode === 'subscription' && s.subscription) {
          const subId =
            typeof s.subscription === 'string' ? s.subscription : s.subscription.id;
          await admin.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_subscription_id: subId,
              plan_key: planKey,
              status: 'active',
            },
            { onConflict: 'stripe_subscription_id' }
          );
        }
        break;
      }

      case 'invoice.paid': {
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
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        const cust = await stripe.customers.retrieve(customerId);
        const userId =
          typeof cust !== 'string' && 'metadata' in cust
            ? (cust as any)?.metadata?.supabase_user_id
            : undefined;
        if (!userId) break;

        const planKey = (sub.metadata?.plan_key as string | undefined) ?? undefined;
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
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e: any) {
    console.error('[webhook] handler error:', e?.message || e);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
