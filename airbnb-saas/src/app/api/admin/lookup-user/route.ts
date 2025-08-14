// /app/api/admin/lookup-user/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = (url.searchParams.get('email') || '').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

    // only allow the configured admin to use this
    const supa = createRouteHandlerClient({ cookies });
    const { data: auth } = await supa.auth.getUser();
    const isAdmin =
      auth?.user?.email && process.env.ADMIN_EMAIL &&
      auth.user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // auth.users is readable with the service key
    const { data, error } = await admin
      .from('auth.users' as any)
      .select('id, email')
      .ilike('email', email)
      .limit(1)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ userId: data.id, email: data.email });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'lookup failed' }, { status: 500 });
  }
}
