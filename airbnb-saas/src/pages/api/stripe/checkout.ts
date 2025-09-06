import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

type Mode = 'subscription' | 'payment';

function resolvePrice(kind?: string, priceId?: string): { price: string; mode: Mode } {
  if (priceId) {
    const coins = process.env.NEXT_PUBLIC_COINS_PRICE_ID || process.env.COINS_PRICE_ID;
    const isCoins = !!coins && priceId === coins;
    return { price: priceId, mode: isCoins ? 'payment' : 'subscription' };
  }

  const starter = process.env.NEXT_PUBLIC_STARTER_PRICE_ID || process.env.STARTER_PRICE_ID;
  const premium = process.env.NEXT_PUBLIC_PREMIUM_PRICE_ID || process.env.PREMIUM_PRICE_ID;
  const coins   = process.env.NEXT_PUBLIC_COINS_PRICE_ID   || process.env.COINS_PRICE_ID;

  switch ((kind || '').toLowerCase()) {
    case 'starter':
      if (!starter) throw new Error('Missing STARTER price id');
      return { price: starter, mode: 'subscription' };
    case 'premium':
      if (!premium) throw new Error('Missing PREMIUM price id');
      return { price: premium, mode: 'subscription' };
    case 'coins':
      if (!coins) throw new Error('Missing COINS price id');
      return { price: coins, mode: 'payment' };
    default:
      throw new Error('Provide either { kind: "starter"|"premium"|"coins" } or { priceId }');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const supabase = createServerSupabaseClient({ req, res });

    // Try cookie session first
    let {
      data: { user },
    } = await supabase.auth.getUser();

    // Fallback: accept Authorization: Bearer <access_token>
    if (!user) {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
      if (token) {
        const {
          data: { user: tokenUser },
        } = await supabase.auth.getUser(token);
        user = tokenUser ?? null;
      }
    }

    if (!user) return res.status(401).json({ error: 'Unauthorized' });


    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { kind, priceId, quantity } = (body ?? {}) as {
      kind?: 'starter' | 'premium' | 'coins';
      priceId?: string;
      quantity?: number;
    };

    const { price, mode } = resolvePrice(kind, priceId);
    const qty = mode === 'payment' && quantity && quantity > 0 ? quantity : 1;

    // Ensure Stripe customer exists and is stored on profiles
    // Ensure Stripe customer exists and is valid for the current key (test vs live)
const { data: profile } = await supabase
  .from('profiles')
  .select('id, email, stripe_customer_id')
  .eq('id', user.id)
  .single();

let customerId = profile?.stripe_customer_id ?? null;

// If we have a stored customer id, verify it exists in THIS Stripe mode
if (customerId) {
  try {
    const c = await stripe.customers.retrieve(customerId);
    if ((c as any)?.deleted) {
      customerId = null; // deleted in Stripe
    }
  } catch (err: any) {
    // resource_missing happens when the id is from the other mode (test vs live)
    if (err?.raw?.type === 'invalid_request_error' || err?.code === 'resource_missing') {
      customerId = null;
    } else {
      throw err;
    }
  }
}

if (!customerId) {
  const customer = await stripe.customers.create({
    email: profile?.email ?? undefined,
    metadata: { supabase_user_id: user.id },
  });
  customerId = customer.id;
  await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
}

const customerIdStr = String(customerId);


    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (!siteUrl) throw new Error('Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL');

    // ✅ Strongly-typed params object; include subscription_data only when mode === 'subscription'
   const params: Stripe.Checkout.SessionCreateParams = {
  customer: customerIdStr,
  mode, // 'subscription' | 'payment'
  line_items: [{ price, quantity: qty }],
  success_url: `${siteUrl}/app/billing?status=success`,
  cancel_url: `${siteUrl}/app/billing?status=cancel`,
  allow_promotion_codes: true,
  billing_address_collection: 'auto',
  metadata: { supabase_user_id: user.id, kind: kind ?? '' },
  // no subscription_data here; Checkout doesn't accept trial_from_plan
};


    const session = await stripe.checkout.sessions.create(params);

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    console.error('[api/stripe/checkout] error:', e);
    return res.status(500).json({ error: e?.message ?? 'Checkout error' });
  }
}
