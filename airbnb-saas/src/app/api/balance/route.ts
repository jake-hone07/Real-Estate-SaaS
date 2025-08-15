// app/api/credits/balance/route.ts
// Returns the signed-in user's balance by summing credits_ledger.
// Uses service role so RLS won't block reads.

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

export async function GET() {
  const supabase = createRouteHandlerClient<any>({ cookies });
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: rows, error } = await admin
    .from('credits_ledger')
    .select('delta')
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const balance = (rows ?? []).reduce((a, r) => a + (r.delta ?? 0), 0);
  return NextResponse.json({ balance });
}
