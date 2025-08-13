// app/api/stripe/checkout/route.ts
// Compatibility endpoint mirroring /api/checkout (some code paths may still call this)
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';
import { getPlan } from '@/lib/billing';

export const runtime = 'nodejs';

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v.trim();
}
function absUrl(req: Request, path: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
  if (base && /^https?:\/\//i.test(base)) return new URL(path, base + '/').toString();
  return new URL(path, new URL(req.url).origin).toString();
}

const stripe = new Stripe(mustEnv('STRIPE_SECRET_KEY'));

async function ensureStripeCustomer(opts: {
  supabase: ReturnType<typeof createRouteHandlerClient<any>>;
  userId: string;
  email?: string;
}) {
  const { supabase, userId, email } = opts;

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .maybeSingle();

  const existing = profile?.stripe_customer_id;
  if (existing) {
    try {
      await stripe.customers.retrieve(existing);
      return existing;
    } catch {
      // recreate
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
    await supabase
      .from('profiles')
      .upsert({ id: userId, stripe_customer_id: created.id }, { onConflict: 'id' });
  }

  return created.id;
}

async function createSession(req: Request, planKey: string) {
  const supabase = createRouteHandlerClient<any>({ cookies });
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };

  const planResult = getPlan(planKey);
  if (!planResult?.def) {
    return { error: NextResponse.json({ error: 'Invalid plan' }, { status: 400 }) };
  }
  const { key, def } = planResult;

  if (!def.priceId) {
    return { error: NextResponse.json({ error: 'Plan is missing Stripe priceId' }, { status: 500 }) };
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

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as { planKey?: string } | null;
    const planKey = body?.planKey;
    if (!planKey) return NextResponse.json({ error: 'Missing planKey' }, { status: 400 });

    const { error, session } = await createSession(req, planKey);
    if (error) return error;
    return NextResponse.json({ id: session!.id, url: session!.url }, { status: 200 });
  } catch (e: any) {
    console.error('[stripe/checkout POST] error:', e?.message || e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const planKey = url.searchParams.get('planKey') || undefined;
    if (!planKey) return NextResponse.json({ error: 'Missing planKey' }, { status: 400 });

    const { error, session } = await createSession(req, planKey);
    if (error) return error;
    return NextResponse.redirect(session!.url!, { status: 302 });
  } catch (e: any) {
    console.error('[stripe/checkout GET] error:', e?.message || e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
