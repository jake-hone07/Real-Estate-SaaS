// /app/api/stripe/customer-portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any });

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.redirect(new URL('/login', req.url));

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : req.nextUrl.origin);

    const customer = await ensureCustomerByEmail(user.email!);

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${baseUrl}/billing`,
    });

    return NextResponse.redirect(portal.url, { status: 303 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'portal failed' }, { status: 500 });
  }
}

async function ensureCustomerByEmail(email: string) {
  const list = await stripe.customers.list({ email, limit: 1 });
  if (list.data[0]) return list.data[0];
  return stripe.customers.create({ email });
}
