// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';
import { getPlan } from '@/lib/billing';

export const runtime = 'nodejs';

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/** Build absolute URLs safely (uses NEXT_PUBLIC_APP_URL if set, else request origin). */
function absUrl(req: Request, path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (base && /^https?:\/\//i.test(base)) return new URL(path, base).toString();
  return new URL(path, new URL(req.url).origin).toString();
}

const stripe = new Stripe(mustEnv('STRIPE_SECRET_KEY'));

type PlanDef = {
  name: string;
  credits: number;
  priceId: string;
  priceLabel: string;
  mode: 'subscription' | 'payment';
};
type PlanResult = { key: string; def: PlanDef };
type Body = { planKey?: string };

async function ensureStripeCustomer(opts: {
  supabase: ReturnType<typeof createRouteHandlerClient<any>>;
  userId: string;
  email?: string;
}) {
  const { supabase, userId, email } = opts;

  const { data: profile, error: readErr } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .maybeSingle();
  if (readErr) console.warn('[checkout] profile read:', readErr.message);

  const existing = profile?.stripe_customer_id;
  if (existing) {
    try {
      await stripe.customers.retrieve(existing);
      return existing;
    } catch {
      console.warn('[checkout] saved customer not found in Stripe, recreating…');
    }
  }

  const created = await stripe.customers.create({
    email: email ?? profile?.email ?? undefined,
    metadata: { supabase_user_id: userId },
  });

  const { error: upErr } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: created.id })
    .eq('id', userId);

  if (upErr) {
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, stripe_customer_id: created.id }, { onConflict: 'id' });
    if (upsertErr) console.warn('[checkout] profile upsert:', upsertErr.message);
  }

  return created.id;
}

async function createSession(req: Request, planKey: string) {
  const supabase = createRouteHandlerClient<any>({ cookies });
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };

  const planResult = getPlan(planKey) as PlanResult | null | undefined;
  if (!planResult?.def) {
    return { error: NextResponse.json({ error: 'Invalid plan' }, { status: 400 }) };
  }
  const { key, def } = planResult;
  if (!def.priceId || (def.mode !== 'subscription' && def.mode !== 'payment')) {
    return { error: NextResponse.json({ error: 'Plan misconfigured' }, { status: 500 }) };
  }

  const customerId = await ensureStripeCustomer({
    supabase,
    userId: user.id,
    email: user.email ?? undefined,
  });

  const successUrl = absUrl(req, '/billing?checkout=success');
  const cancelUrl = absUrl(req, '/billing?checkout=canceled');

  const session = await stripe.checkout.sessions.create({
    mode: def.mode,
    customer: customerId,
    line_items: [{ price: def.priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    automatic_tax: { enabled: false },
    metadata: {
      supabase_user_id: user.id,
      plan_key: key,
      plan_name: def.name,
    },
  });

  return { session };
}

// ---------- POST: JSON body { planKey } → { id, url } (kept for API usage) ----------
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    const planKey = body?.planKey;
    if (!planKey) {
      return NextResponse.json({ error: 'Missing planKey' }, { status: 400 });
    }

    const { error, session } = await createSession(req, planKey);
    if (error) return error;

    return NextResponse.json({ id: session!.id, url: session!.url }, { status: 200 });
  } catch (e: any) {
    console.error('[checkout POST] error:', e?.message || e);
    return NextResponse.json(
      { error: 'Unexpected error creating checkout session.' },
      { status: 500 }
    );
  }
}

// ---------- GET: /api/checkout?planKey=Starter → 302 redirect to Stripe ----------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const planKey = url.searchParams.get('planKey') || undefined;
    if (!planKey) {
      return NextResponse.json({ error: 'Missing planKey' }, { status: 400 });
    }

    const { error, session } = await createSession(req, planKey);
    if (error) return error;

    // Redirect the browser directly to Stripe
    return NextResponse.redirect(session!.url!, { status: 302 });
  } catch (e: any) {
    console.error('[checkout GET] error:', e?.message || e);
    return NextResponse.json(
      { error: 'Unexpected error creating checkout session.' },
      { status: 500 }
    );
  }
}
