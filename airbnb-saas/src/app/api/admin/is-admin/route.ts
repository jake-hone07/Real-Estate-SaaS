// /app/api/admin/is-admin/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: auth } = await supabase.auth.getUser();
    const email = auth?.user?.email ?? null;

    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdmin = Boolean(email && adminEmail && email.toLowerCase() === adminEmail.toLowerCase());

    return NextResponse.json({ isAdmin, email });
  } catch (e: any) {
    return NextResponse.json({ isAdmin: false, error: e?.message || 'unknown error' }, { status: 500 });
  }
}
