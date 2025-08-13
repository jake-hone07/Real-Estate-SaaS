// app/api/credits/grant-initial/route.ts
// One-time initializer: ensures the signed-in user has at least 4 credits
// in the ledger (for apps that previously displayed a hardcoded “4 free”).
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const runtime = 'nodejs';

const MIN_FREE_CREDITS = 4;

export async function POST() {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies });
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // current balance from ledger
    const { data: s, error: sumErr } = await supabase
      .from('credits_ledger')
      .select('total:sum(delta)')
      .eq('user_id', user.id)
      .single<{ total: number | null }>();

    if (sumErr) {
      console.error('[grant-initial] sum error:', sumErr.message);
      return NextResponse.json({ error: 'Read error' }, { status: 500 });
    }

    const current = s?.total ?? 0;
    if (current >= MIN_FREE_CREDITS) {
      return NextResponse.json({ ok: true, granted: 0, balance: current }, { status: 200 });
    }

    const toGrant = MIN_FREE_CREDITS - current;

    const { error: insErr } = await supabase.from('credits_ledger').insert({
      user_id: user.id,
      delta: toGrant,
      reason: 'init:free',
    });

    if (insErr) {
      console.error('[grant-initial] insert error:', insErr.message);
      return NextResponse.json({ error: 'Grant error' }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, granted: toGrant, balance: MIN_FREE_CREDITS },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('[grant-initial] exception:', e?.message || e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
