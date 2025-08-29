// src/app/api/listings/route.ts
import { NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await req.json();

  // attach owner + server-side timestamp
  const row = {
    ...payload,
    user_id: user.id,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('listings')
    .insert([row])
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, listing: data });
}
