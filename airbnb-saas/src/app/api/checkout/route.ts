// /app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any });

// Your env var names
const STARTER_PRICE_ID = process.env.STARTER_PRICE_ID;   // e.g. price_1Rv21j...
const PREMIUM_PRICE_ID = process.env.PREMIUM_PRICE_ID;   // e.g. price_1Rv22n...
const COINS_PRICE_ID   = process.env.COINS_PRICE_ID;     // e.g. price_1RukkO...

// how many credits a coins purchase adds
const COINS_CREDITS = 15;

type Plan = { priceId?: string; mode: 'subscription' | 'payment'; credits?: number; name: string };

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sku = (url.searchParams.get('sku') || '').toLowerCase();

    const supabase = createRouteHandlerClient({ cookies });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.redirect(new URL('/login', url.origin));

    // ✅ stable base URL for Stripe return links
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : url.origin);

    const map: Record<string, Plan> = {
      starter:  { priceId: STARTER_PRICE_ID,  mode: 'subscription', name: 'starter' },
      premium:  { priceId: PREMIUM_PRICE_ID,  mode: 'subscription', name: 'premium' },
      coins:    { priceId: COINS_PRICE_ID,    mode: 'payment',      credits: COINS_CREDITS, name: 'coins' },
      topup15:  { priceId: COINS_PRICE_ID,    mode: 'payment',      credits: COINS_CREDITS, name: 'coins' }, // alias
    };

    const plan = map[sku];
    if (!plan) {
      return NextResponse.json({ error: 'Unknown sku. Use one of: starter, premium, coins.' }, { status: 400 });
    }
    if (!plan.priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for "${sku}". Set ${envNameForSku(sku)} in your env.` },
        { status: 500 }
      );
    }

    const customer = await ensureCustomerByEmail(user.email!);

    const session = await stripe.checkout.sessions.create({
      mode: plan.mode,
      customer: customer?.id,
      customer_email: customer ? undefined : user.email!,
      client_reference_id: user.id,
      success_url: `${baseUrl}/billing?success=1`,
      cancel_url: `${baseUrl}/billing?canceled=1`,
      metadata: {
        user_id: user.id,
        sku: plan.name,
        credits: plan.credits ? String(plan.credits) : '',
      },
      line_items: [{ price: plan.priceId, quantity: 1 }],
    });

    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'checkout failed' }, { status: 500 });
  }
}

function envNameForSku(sku: string) {
  if (sku === 'starter') return 'STARTER_PRICE_ID';
  if (sku === 'premium') return 'PREMIUM_PRICE_ID';
  if (sku === 'coins' || sku === 'topup15') return 'COINS_PRICE_ID';
  return 'PRICE_ID';
}

async function ensureCustomerByEmail(email: string) {
  const list = await stripe.customers.list({ email, limit: 1 });
  if (list.data[0]) return list.data[0];
  return stripe.customers.create({ email });
}
