// app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const runtime = 'nodejs';

// --- Types you can adjust to your app ---
type GenerateRequest = {
  // whatever your client sends; keep these generic
  title?: string;
  propertyFacts?: Record<string, any>;
  prompt?: string;
};

type GenerateResult = {
  output: string;
  meta?: Record<string, any>;
};

// --- Replace this with your real generation logic ---
async function generateListing(input: GenerateRequest): Promise<GenerateResult> {
  // TODO: hook up your model/service here.
  // For now, we return a stub that proves the flow is working.
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

    // --- Auth ---
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- Parse body ---
    let payload: GenerateRequest | null = null;
    try {
      payload = (await req.json()) as GenerateRequest;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // --- 1) Check balance ---
    const { data: balRow, error: balErr } = await supabase
      .from('credits_balance')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (balErr) {
      console.error('[generate] balance read error:', balErr.message);
      return NextResponse.json({ error: 'Billing read error' }, { status: 500 });
    }

    const balance = balRow?.balance ?? 0;
    if (balance <= 0) {
      // 402 Payment Required is semantically correct; your client can handle it.
      return NextResponse.json({ error: 'Out of credits' }, { status: 402 });
    }

    // --- 2) Do the generation work ---
    const result = await generateListing(payload || {});

    // --- 3) Decrement credits (-1) ---
    const { error: decErr } = await supabase.from('credits_ledger').insert({
      user_id: user.id,
      delta: -1,
      reason: 'generation',
    });
    if (decErr) {
      console.error('[generate] credit decrement failed:', decErr.message);
      // You could choose to still return the result. Safer is to fail so you don’t give away free work.
      return NextResponse.json({ error: 'Billing error' }, { status: 500 });
    }

    // --- 4) Return payload ---
    return NextResponse.json(
      {
        ok: true,
        credits_left: balance - 1,
        result,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error('[generate] unhandled error:', e?.message || e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
