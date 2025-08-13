// app/api/billing/portal/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';

export const runtime = 'nodejs';

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}
const stripe = new Stripe(mustEnv('STRIPE_SECRET_KEY'));

async function createPortalUrl() {
  const supabase = createRouteHandlerClient<any>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.stripe_customer_id) {
    return { error: NextResponse.json({ error: 'No Stripe customer' }, { status: 400 }) };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url:
      process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/billing`
        : 'http://localhost:3000/billing',
  });

  return { url: session.url };
}

// POST: returns JSON { url }
export async function POST() {
  try {
    const { error, url } = await createPortalUrl();
    if (error) return error;
    return NextResponse.json({ url }, { status: 200 });
  } catch (e: any) {
    console.error('[portal POST] error:', e?.message || e);
    return NextResponse.json({ error: 'Portal error' }, { status: 500 });
  }
}

// GET: redirects directly to portal URL
export async function GET() {
  try {
    const { error, url } = await createPortalUrl();
    if (error) return error;
    return NextResponse.redirect(url!, { status: 302 });
  } catch (e: any) {
    console.error('[portal GET] error:', e?.message || e);
    return NextResponse.json({ error: 'Portal error' }, { status: 500 });
  }
}
