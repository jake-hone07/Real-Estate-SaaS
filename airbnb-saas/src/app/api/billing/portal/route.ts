// app/api/billing/portal/route.ts
// POST → { url } (JSON) for fetch-based button
// GET  → 302 redirect (for <a href=...>)
// Returns clear error messages to the client for easier debugging.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';

export const runtime = 'nodejs';

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

const stripe = new Stripe(mustEnv('STRIPE_SECRET_KEY'));

async function ensureStripeCustomer(opts: {
  supabase: ReturnType<typeof createRouteHandlerClient<any>>;
  userId: string;
  email?: string | null;
}) {
  const { supabase, userId, email } = opts;

  const { data: profile, error: readErr } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .maybeSingle();
  if (readErr) console.warn('[portal] profile read error:', readErr.message);

  const existing = profile?.stripe_customer_id;
  if (existing) {
    try {
      await stripe.customers.retrieve(existing);
      return existing;
    } catch {
      console.warn('[portal] saved customer not found at Stripe; recreating…');
    }
  }

  const created = await stripe.customers.create({
    email: email ?? profile?.email ?? undefined,
    metadata: { supabase_user_id: userId },
  });

  // best-effort persist
  const { error: upErr } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: created.id })
    .eq('id', userId);
  if (upErr) {
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ id: userId, stripe_customer_id: created.id }, { onConflict: 'id' });
    if (upsertErr) console.warn('[portal] profile upsert error:', upsertErr.message);
  }

  return created.id;
}

async function createPortalUrl(req: Request) {
  const supabase = createRouteHandlerClient<any>({ cookies });

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) {
    console.error('[portal] supabase.auth.getUser error:', authErr.message);
  }
  const user = auth?.user;
  if (!user) {
    return { status: 401 as const, error: 'Unauthorized: no active user session on this origin.' };
  }

  const customerId = await ensureStripeCustomer({
    supabase,
    userId: user.id,
    email: user.email ?? null,
  });

  const base = (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') ||
                new URL(req.url).origin);
  const returnUrl = `${base}/billing`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { status: 200 as const, url: session.url };
  } catch (e: any) {
    // Surface Stripe error message to the client (common: portal not enabled)
    const msg = e?.message || 'Stripe error creating Billing Portal session.';
    console.error('[portal] stripe error:', msg);
    return { status: 500 as const, error: msg };
  }
}

// POST → JSON
export async function POST(req: Request) {
  try {
    const res = await createPortalUrl(req);
    if ('error' in res) {
      return NextResponse.json({ error: res.error }, { status: res.status });
    }
    return NextResponse.json({ url: res.url }, { status: 200 });
  } catch (e: any) {
    console.error('[portal POST] server exception:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Portal server exception' }, { status: 500 });
  }
}

// GET → redirect
export async function GET(req: Request) {
  try {
    const res = await createPortalUrl(req);
    if ('error' in res) {
      return NextResponse.json({ error: res.error }, { status: res.status });
    }
    return NextResponse.redirect(res.url!, { status: 302 });
  } catch (e: any) {
    console.error('[portal GET] server exception:', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Portal server exception' }, { status: 500 });
  }
}
