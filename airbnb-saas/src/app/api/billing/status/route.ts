// /app/api/billing/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(_req: NextRequest) {
  const supa = createRouteHandlerClient({ cookies });
  const { data: auth } = await supa.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const [{ data: subs }, { data: credits }] = await Promise.all([
    supa.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
    supa.from('credit_ledger').select('delta').eq('user_id', user.id),
  ]);

  const balance = (credits || []).reduce((n: number, r: any) => n + Number(r.delta || 0), 0);

  return NextResponse.json({
    plan: subs?.plan ?? null,
    status: subs?.status ?? null,
    current_period_end: subs?.current_period_end ?? null,
    balance,
  });
}
