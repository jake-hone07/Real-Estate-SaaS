import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://localhost:3000';

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // need stripe_customer_id on profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single();

  if (error) return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });

  let customerId = profile?.stripe_customer_id as string | null;

  if (!customerId) {
    // create customer on the fly
    const customer = await stripe.customers.create({
      email: (user.email ?? profile?.email) || undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId!,
    return_url: `${SITE_URL}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
