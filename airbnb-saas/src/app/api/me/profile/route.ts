import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ data: null }, { status: 401 });
  }

  // Fetch profile data
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('plan, credits')
    .eq('id', user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ✅ Return clean JSON without stringifying
  return NextResponse.json({
    data: {
      plan: profile.plan,
      credits: profile.credits,
    },
  });
}
