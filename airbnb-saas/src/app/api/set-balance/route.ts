import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v.trim();
}

const admin = createClient(
  mustEnv('SUPABASE_URL'),
  mustEnv('SUPABASE_SERVICE_ROLE_KEY'),
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<any>({ cookies });
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const target = Number(body?.amount);
  if (!Number.isFinite(target) || target < 0) {
    return NextResponse.json({ error: 'amount must be a non-negative number' }, { status: 400 });
  }

  const { data: rows, error: readErr } = await admin
    .from('credits_ledger')
    .select('delta')
    .eq('user_id', user.id);

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const current = (rows ?? []).reduce((a, r) => a + (r.delta ?? 0), 0);
  const delta = target - current;
  if (delta === 0) return NextResponse.json({ ok: true, balance: target, delta: 0 });

  const { error: insErr } = await admin.from('credits_ledger').insert({
    user_id: user.id,
    delta,
    reason: 'admin:set-balance',
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, balance: target, delta });
}
