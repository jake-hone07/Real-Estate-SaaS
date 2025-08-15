import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Ensure a profile row exists
    const { data: existing, error: selErr } = await supabase
      .from('profiles')
      .select('id, credits, plan_tier')
      .eq('id', user.id)
      .maybeSingle();

    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 400 });

    if (!existing) {
      const { data: inserted, error: insErr } = await supabase
        .from('profiles')
        .insert({ id: user.id })  // defaults: credits 0, plan_tier 'free'
        .select('id, credits, plan_tier')
        .single();
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

      return NextResponse.json({
        user: { id: user.id, email: user.email },
        credits: inserted.credits ?? 0,
        plan: inserted.plan_tier ?? 'free',
      });
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      credits: existing.credits ?? 0,
      plan: existing.plan_tier ?? 'free',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 });
  }
}
