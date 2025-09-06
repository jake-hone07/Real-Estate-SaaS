import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { stripe } from '@/lib/stripe';

/**
 * POST /api/stripe/portal
 * Returns { url } for Stripe Billing Portal
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Auth: cookie first, then Bearer token (helps with Codespaces)
    const supabase = createServerSupabaseClient({ req, res });
    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const token = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined;
      if (token) {
        const { data: { user: tokenUser } } = await supabase.auth.getUser(token);
        user = tokenUser ?? null;
      }
    }
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch or (re)create a Stripe customer that matches current mode
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id ?? null;

    if (customerId) {
      try {
        const c = await stripe.customers.retrieve(customerId);
        if ((c as any)?.deleted) customerId = null;
      } catch (err: any) {
        // stale id from the other Stripe mode (test vs live), or missing
        customerId = null;
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

    const returnBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (!returnBase) return res.status(500).json({ error: 'Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId!,
      return_url: `${returnBase}/app/billing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (e: any) {
    console.error('[api/stripe/portal] error:', e);
    return res.status(500).json({ error: e?.message ?? 'Portal error' });
  }
}
