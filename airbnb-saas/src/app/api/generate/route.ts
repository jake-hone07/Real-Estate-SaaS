// app/api/generate/route.ts
// Generation endpoint with credit checks for Starter/None and soft caps for Premium.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const runtime = 'nodejs';

// Soft cap for Premium (fair use)
const PREMIUM_DAILY_SOFT_CAP = 300; // requests/day
// Optionally: const PREMIUM_PER_MIN_SOFT_CAP = 30;

type GenerateRequest = {
  title?: string;
  propertyFacts?: Record<string, any>;
  prompt?: string;
};

type GenerateResult = {
  output: string;
  meta?: Record<string, any>;
};

// Replace with your real generation logic
async function generateListing(input: GenerateRequest): Promise<GenerateResult> {
  const summary = input.title
    ? `Generated listing for: ${input.title}`
    : 'Generated listing.';
  return {
    output: `${summary}\n\n(This is a placeholder. Wire your real generator here.)`,
    meta: { placeholder: true },
  };
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient<any>({ cookies });

    // Auth
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Parse
    const payload = (await req.json().catch(() => ({}))) as GenerateRequest;

    // Read plan & balance
    const [{ data: profile }, { data: balRow }] = await Promise.all([
      supabase.from('profiles').select('plan_key').eq('id', user.id).maybeSingle(),
      supabase.from('credits_balance').select('balance').eq('user_id', user.id).maybeSingle(),
    ]);

    const planKey = (profile?.plan_key as string | null) ?? null;

    if (planKey === 'Premium') {
      // Soft daily cap for Premium
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('credits_ledger')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('reason', 'generation')
        .gte('created_at', since);

      if ((count ?? 0) >= PREMIUM_DAILY_SOFT_CAP) {
        return NextResponse.json(
          { error: 'You reached today’s fair-use limit on Premium. Try again later.' },
          { status: 429 }
        );
      }

      // Generate (no credit decrement)
      const result = await generateListing(payload);
      // Optionally record a zero-cost usage marker (not required). We’ll keep it simple.

      return NextResponse.json({ ok: true, plan: 'Premium', result }, { status: 200 });
    }

    // Starter / None: require credits > 0
    const balance = balRow?.balance ?? 0;
    if (balance <= 0) {
      return NextResponse.json({ error: 'Out of credits' }, { status: 402 });
    }

    // Do the work
    const result = await generateListing(payload);

    // Decrement credits (-1)
    const { error: decErr } = await supabase.from('credits_ledger').insert({
      user_id: user.id,
      delta: -1,
      reason: 'generation',
    });
    if (decErr) {
      console.error('[generate] credit decrement failed:', decErr.message);
      return NextResponse.json({ error: 'Billing error' }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, plan: planKey ?? 'None', credits_left: balance - 1, result },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('[generate] unhandled error:', e?.message || e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
