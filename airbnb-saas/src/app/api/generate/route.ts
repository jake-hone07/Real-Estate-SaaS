// /app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

type GenerateBody = { title?: string; prompt?: string; [k: string]: any };

export async function POST(req: NextRequest) {
  const userClient = createRouteHandlerClient({ cookies });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase env' }, { status: 500 });
  }
  const admin = createClient(url, serviceKey);

  // Auth
  const { data: auth } = await userClient.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Inputs
  const body: GenerateBody = await req.json().catch(() => ({}));
  const title = body?.title?.trim() || 'Untitled Listing';
  const prompt = (body?.prompt ?? '').toString().trim();

  // Ledger balance (admin bypasses RLS)
  const { data: rows, error: sumErr } = await admin
    .from('credit_ledger')
    .select('delta')
    .eq('user_id', user.id);
  if (sumErr) return NextResponse.json({ error: sumErr.message }, { status: 500 });

  const balance = (rows || []).reduce((n, r: any) => n + Number(r?.delta ?? 0), 0);
  if (balance < 1) return NextResponse.json({ error: 'Not enough credits' }, { status: 402 });

  // Debit first (idempotent by external_id)
  const requestId = crypto.randomUUID();
  const { data: existing, error: existErr } = await admin
    .from('credit_ledger')
    .select('id')
    .eq('user_id', user.id)
    .eq('external_id', requestId)
    .maybeSingle();
  if (existErr) return NextResponse.json({ error: existErr.message }, { status: 500 });

  if (!existing) {
    const { error: debitErr } = await admin.from('credit_ledger').insert({
      user_id: user.id,
      delta: -1,
      reason: 'generation',
      external_id: requestId,
      metadata: { route: '/api/generate', title }
    });
    if (debitErr) return NextResponse.json({ error: `Could not debit: ${debitErr.message}` }, { status: 500 });
  }

  // Do the generation (stub — replace with your model)
  let generatedText: string | null = null;
  try {
    generatedText = prompt
      ? `Generated listing based on your input:\n\n${prompt}\n\n— ListingForge`
      : `Generated listing placeholder. (Add your model call here.)\n\n— ListingForge`;
  } catch (e: any) {
    await admin.from('credit_ledger').insert({
      user_id: user.id,
      delta: +1,
      reason: 'refund_generation_failed',
      external_id: `${requestId}-refund`,
      metadata: { route: '/api/generate' }
    });
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }

  if (!generatedText) {
    await admin.from('credit_ledger').insert({
      user_id: user.id,
      delta: +1,
      reason: 'refund_generation_failed',
      external_id: `${requestId}-refund`,
      metadata: { route: '/api/generate' }
    });
    return NextResponse.json({ error: 'No content generated' }, { status: 500 });
  }

  // Save as the user (RLS-respecting)
  const { data: inserted, error: insErr } = await userClient
    .from('listings')
    .insert({ user_id: user.id, title, description: generatedText })
    .select('*')
    .single();

  // return text even if save fails (don’t burn user’s result)
  return NextResponse.json({
    ok: true,
    listing: generatedText,
    saved: inserted ?? null,
    debited: 1,
    requestId
  });
}
