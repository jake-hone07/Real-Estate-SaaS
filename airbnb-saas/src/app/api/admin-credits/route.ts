import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  // 🔒 Only allow your admin email
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { targetUserId, delta, reason } = await req.json();

  if (!targetUserId || typeof delta !== 'number') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { error } = await supabase
    .from('credit_ledger')
    .insert({
      user_id: targetUserId,
      delta,
      reason: reason || 'admin_adjustment',
      external_id: crypto.randomUUID(),
    });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
