// src/app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { OpenAI } from 'openai';

/* -------------------- Config -------------------- */

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️ OPENAI_API_KEY is not set');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Add any future premium-only templates here
const PREMIUM_ONLY_TEMPLATES = new Set(['luxury']);

type Plan = 'free' | 'starter' | 'premium';

type ListingInput = {
  address?: string;
  bedrooms?: string | number;
  bathrooms?: string | number;
  squareFeet?: string | number;
  features?: string;
  tone?: string;
  translate?: boolean;
  neighborhood?: string;
  interiorStyle?: string;
  renovations?: string;
  outdoorFeatures?: string;
  amenitiesNearby?: string;   // client alias
  nearbyAmenities?: string;   // normalized
  hoaInfo?: string;
  template?: 'default' | 'luxury' | 'rental' | 'vacation' | 'flip';
  [k: string]: any;
};

/* -------------------- Utils -------------------- */

const ok = (body: any, init?: number) =>
  NextResponse.json(body, { status: init ?? 200 });

const err = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

function normalizeInput(raw: any): ListingInput {
  const input = (raw ?? {}) as ListingInput;
  return {
    ...input,
    nearbyAmenities:
      input.nearbyAmenities ??
      (input as any).amenitiesNearby ??
      (input as any).nearby_amenities ??
      undefined,
    tone: input.tone || 'Professional',
    template: input.template || 'default',
  };
}

function buildFacts(input: ListingInput) {
  const facts: Record<string, string | number | boolean> = {};
  const add = (k: keyof ListingInput, v: any) => {
    if (v !== undefined && v !== null && `${v}`.trim?.() !== '') facts[k] = v;
  };
  add('address', input.address);
  add('neighborhood', input.neighborhood);
  add('bedrooms', input.bedrooms);
  add('bathrooms', input.bathrooms);
  add('squareFeet', input.squareFeet);
  add('interiorStyle', input.interiorStyle);
  add('renovations', input.renovations);
  add('outdoorFeatures', input.outdoorFeatures);
  add('features', input.features);
  add('nearbyAmenities', input.nearbyAmenities);
  add('hoaInfo', input.hoaInfo);
  add('tone', input.tone || 'Professional');
  return facts;
}

function buildPrompt(input: ListingInput): string {
  const facts = buildFacts(input);
  const tone = String(facts.tone || 'Professional').toLowerCase();

  return `You are a real-estate copywriter. Produce an Airbnb-style listing that is FACTS-ONLY.

FACTS (authoritative JSON):
${JSON.stringify(facts, null, 2)}

HARD RULES:
- Use ONLY the data in FACTS. Do not invent amenities, views, distances, or neighborhood claims.
- If a detail is missing in FACTS, omit it.
- Keep it specific, concrete, and buyer/renter friendly.
- Length target: 220–260 words (English).
- Tone: ${tone}.

OUTPUT FORMAT (exact headings, with a blank line after each):

**Overview**
[Two short paragraphs, 2–4 sentences each. Summarize who this suits + key benefits from FACTS.]

**Highlights**
- [3–6 bullets. Each bullet maps 1:1 to an item in FACTS.]

**Details**
- Bedrooms: ${input.bedrooms ?? '—'} • Bathrooms: ${input.bathrooms ?? '—'} • Approx. ${input.squareFeet ?? '—'} sq ft
- Interior style: ${input.interiorStyle || '—'}
- Renovations: ${input.renovations || '—'}
- Outdoor features: ${input.outdoorFeatures || '—'}
- Special features: ${input.features || '—'}
- Nearby amenities: ${(input.nearbyAmenities) || '—'}
- HOA: ${input.hoaInfo || '—'}

QUALITY:
- Prefer concrete nouns and active verbs over vague hype.
- No placeholders like "undefined".` + (input.translate
  ? `

Now provide a full Spanish translation with the SAME headings and bullet structure. Keep FACTS-ONLY.`
  : '');
}

function sanitizeAgainstFacts(text: string, input: ListingInput) {
  const allowed = [
    input.address, input.neighborhood, input.interiorStyle, input.renovations,
    input.outdoorFeatures, input.features, input.nearbyAmenities, input.amenitiesNearby, input.hoaInfo,
  ].filter(Boolean).map((s) => String(s).toLowerCase());

  const risky = [
    'balcony','deck','patio','fireplace','pool','hot tub','jacuzzi','sauna',
    'rooftop','mountain view','ocean view','waterfront','garage','driveway','spa'
  ];

  return text
    .split('\n')
    .filter(line => {
      const l = line.toLowerCase();
      const mentionsRisky = risky.some(w => l.includes(w));
      if (!mentionsRisky) return true;
      // keep only if explicitly present in inputs
      return allowed.some(a => risky.some(w => a.includes(w) && l.includes(w)));
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* -------------------- Route -------------------- */

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // Auth
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) return err('Auth failed', 500);
  const user = auth?.user;
  if (!user) return err('Not authenticated', 401);

  // Profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('plan, credits')
    .eq('id', user.id)
    .single();
  if (profileErr) return err('Profile fetch failed', 500);

  const plan = (profile?.plan ?? 'free') as Plan;
  const isPremium = plan === 'premium';

  // Parse & normalize body
  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return err('Invalid JSON body', 400);
  }
  const input = normalizeInput(raw);

  // 🔒 Generic premium gates (templates)
  if (input.template && PREMIUM_ONLY_TEMPLATES.has(input.template) && !isPremium) {
    return NextResponse.json(
      { error: 'PRO_FEATURE_LOCKED', message: 'This template is a Premium feature.' },
      { status: 403 }
    );
  }

  // Rate limit (non-premium only)
  if (!isPremium) {
    const rl = await supabase.rpc('rate_limit_generate');
    if (rl.error) return err('Rate limit check failed', 500);
    if (!rl.data) return err('Please wait before generating again.', 429);
  }

  // Helpers to revert spend on failures
  const refund = async () => {
    try { await supabase.rpc('refund_credit'); } catch { /* no-op */ }
  };

  // Spend 1 credit upfront for non-premium (reserve)
  if (!isPremium) {
    const spend = await supabase.rpc('spend_credit_reserve');
    if (spend.error || !spend.data) {
      return NextResponse.json({ error: 'Out of credits' }, { status: 402 });
    }
  }

  try {
    // Generate
    const prompt = buildPrompt(input);
    let listing = '';
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      listing = completion.choices?.[0]?.message?.content?.trim() ?? '';
    } catch (e: any) {
      if (!isPremium) await refund();
      return err(`Model error: ${e?.message || 'unknown'}`, 500);
    }

    if (!listing) {
      if (!isPremium) await refund();
      return err('Generation failed (empty response)', 500);
    }

    listing = sanitizeAgainstFacts(listing, input);
    if (!listing) {
      if (!isPremium) await refund();
      return err('Generation failed after sanitization', 500);
    }

    // Insert listing
    const insertPayload = {
      user_id: user.id,
      title: input.address || 'Untitled',
      description: listing,
      address: input.address ?? null,
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      squareFeet: input.squareFeet ?? null,
      features: input.features ?? null,
      tone: input.tone ?? null,
      translate: input.translate ?? null,
      neighborhood: input.neighborhood ?? null,
      interiorStyle: input.interiorStyle ?? null,
      renovations: input.renovations ?? null,
      outdoorFeatures: input.outdoorFeatures ?? null,
      nearbyAmenities: input.nearbyAmenities ?? null,
      hoaInfo: input.hoaInfo ?? null,
      template: input.template ?? null, // safe: exists if you ran the ALTER
    };

    const { data: saved, error: insertErr } = await supabase
      .from('listings')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertErr || !saved) {
      if (!isPremium) await refund();
      return err(`DB insert failed: ${insertErr?.message || 'unknown'}`, 500);
    }

    // Refresh plan/credits for UI badge
    const { data: after } = await supabase
      .from('profiles')
      .select('plan, credits')
      .eq('id', user.id)
      .single();

    return ok({
      listing,
      saved,
      plan: (after?.plan as Plan) ?? 'free',
      credits: after?.plan === 'premium' ? 'unlimited' : (after?.credits ?? 0),
    });
  } catch (e: any) {
    if (!isPremium) await refund();
    return err(e?.message || 'Unknown error', 500);
  }
}
