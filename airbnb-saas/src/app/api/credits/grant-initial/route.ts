// app/api/credits/grant-initial/route.ts
// One-time initializer: ensure the signed-in user has at least 4 credits in the ledger.
// Uses the SUPABASE SERVICE-ROLE KEY so RLS can't block it.

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const MIN_FREE_CREDITS = 4;

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

const supabaseAdmin = createClient(
  mustEnv('SUPABASE_URL'),
  mustEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false } }
);

export async function POST() {
  try {
    // get current user from cookies (user session)
    const supabaseUser = createRouteHandlerClient<any>({ cookies });
    const { data: auth, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr) {
      return NextResponse.json({ error: `Auth error: ${authErr.message}` }, { status: 401 });
    }
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // read current balance with admin client (bypass RLS)
    const { data: sumRow, error: sumErr } = await supabaseAdmin
      .from('credits_ledger')
      .select('total:sum(delta)')
      .eq('user_id', user.id)
      .single<{ total: number | null }>();

    if (sumErr) {
      return NextResponse.json({ error: `Read error: ${sumErr.message}` }, { status: 500 });
    }

    const current = sumRow?.total ?? 0;
    if (current >= MIN_FREE_CREDITS) {
      return NextResponse.json({ ok: true, granted: 0, balance: current }, { status: 200 });
    }

    const toGrant = MIN_FREE_CREDITS - current;

    const { error: insErr } = await supabaseAdmin.from('credits_ledger').insert({
      user_id: user.id,
      delta: toGrant,
      reason: 'init:free',
    });

    if (insErr) {
      return NextResponse.json({ error: `Grant error: ${insErr.message}` }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, granted: toGrant, balance: MIN_FREE_CREDITS },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}
