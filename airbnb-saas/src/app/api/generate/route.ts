// src/app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { OpenAI } from 'openai';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
if (!process.env.OPENAI_API_KEY) {
  // Let devs see this early instead of mysterious 500s later
  console.warn('⚠️ OPENAI_API_KEY is not set');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

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
  amenitiesNearby?: string; // client variant
  nearbyAmenities?: string; // normalized internal field
  hoaInfo?: string;
};

/* -------------------- Helpers -------------------- */

/** Build a clean facts object (no empty/undefined). */
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
  add('nearbyAmenities', input.nearbyAmenities ?? input.amenitiesNearby);
  add('hoaInfo', input.hoaInfo);
  add('tone', input.tone || 'Professional');
  return facts;
}

/** Strong, facts-only prompt with explicit structure/length. */
function buildPrompt(input: ListingInput): string {
  const facts = buildFacts(input);
  const tone = String(facts.tone || 'Professional').toLowerCase();

  return (
`You are a real-estate copywriter. Produce an Airbnb-style listing that is FACTS-ONLY.

FACTS (authoritative JSON):
${JSON.stringify(facts, null, 2)}

HARD RULES:
- Use ONLY the data in FACTS. Do not invent amenities, views, distances, or neighborhood claims.
- If a detail is missing in FACTS, omit it without speculation.
- Keep it specific, concrete, and buyer/renter friendly.
- Length target: 220–260 words (English).
- Tone: ${tone}.

OUTPUT FORMAT (exact headings, with a blank line after each heading):
**Overview**
[Two short paragraphs, 2–4 sentences each. Summarize who this suits + key benefits derived from FACTS.]

**Highlights**
- [3–6 bullets. Each bullet maps 1:1 to an item in FACTS.]

**Details**
- Bedrooms: ${input.bedrooms ?? '—'} • Bathrooms: ${input.bathrooms ?? '—'} • Approx. ${input.squareFeet ?? '—'} sq ft
- Interior style: ${input.interiorStyle || '—'}
- Renovations: ${input.renovations || '—'}
- Outdoor features: ${input.outdoorFeatures || '—'}
- Special features: ${input.features || '—'}
- Nearby amenities: ${(input.nearbyAmenities ?? input.amenitiesNearby) || '—'}
- HOA: ${input.hoaInfo || '—'}

QUALITY:
- Prefer concrete nouns and active verbs over vague hype.
- No placeholders like "undefined".`
  + (input.translate
      ? `

Now provide a full Spanish translation with the SAME headings and bullet structure. Keep FACTS-ONLY.`
      : '')
  );
}

/** Strip lines that mention risky amenities not present in inputs. */
function sanitizeAgainstFacts(text: string, input: ListingInput) {
  const allowed = [
    input.address, input.neighborhood, input.interiorStyle, input.renovations,
    input.outdoorFeatures, input.features, input.nearbyAmenities, input.amenitiesNearby, input.hoaInfo,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  const risky = [
    'balcony','deck','patio','fireplace','pool','hot tub','jacuzzi','sauna',
    'rooftop','mountain view','ocean view','waterfront','garage','driveway','spa'
  ];

  const lines = text.split('\n');
  const cleaned = lines.filter((line) => {
    const l = line.toLowerCase();
    const mentionsRisky = risky.some((w) => l.includes(w));
    if (!mentionsRisky) return true;

    // allow only if that risky term is explicitly present in user inputs
    const allowedHit = allowed.some((a) =>
      risky.some((w) => a.includes(w) && l.includes(w))
    );
    return allowedHit;
  });

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* -------------------- Route -------------------- */

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // 1) Auth
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userRes?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const user = userRes.user;

  // 2) Rate limit (max 1 request / 10s)
  const { data: allowedRL, error: rlErr } = await supabase.rpc('rate_limit_generate');
  if (rlErr) {
    console.error('Rate limit check error:', rlErr.message);
    return NextResponse.json({ error: 'Rate limit check failed' }, { status: 500 });
  }
  if (!allowedRL) {
    return NextResponse.json(
      { error: 'Please wait a few seconds before generating again.' },
      { status: 429 }
    );
  }

  const refund = async () => { try { await supabase.rpc('refund_credit'); } catch {} };

  try {
    // Normalize incoming body so we always use body.nearbyAmenities internally
    const raw = (await req.json()) as any;
    const body: ListingInput = {
      ...raw,
      nearbyAmenities:
        raw?.nearbyAmenities ??
        raw?.amenitiesNearby ??
        raw?.nearby_amenities ??
        undefined,
    };

    // 3) Spend one credit (atomic)
    const { data: ok, error: spendErr } = await supabase.rpc('spend_credit_reserve');
    if (spendErr || !ok) {
      return NextResponse.json({ error: 'Out of credits' }, { status: 402 });
    }

    // 4) Generate (facts-only, market-ready)
    const prompt = buildPrompt(body);
    let listing = '';
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7, // lower = tighter to facts
      });
      listing = completion.choices?.[0]?.message?.content?.trim() ?? '';
    } catch (modelErr: any) {
      await refund();
      return NextResponse.json({ error: `Model error: ${modelErr?.message || 'unknown'}` }, { status: 500 });
    }

    if (!listing) {
      await refund();
      return NextResponse.json({ error: 'Generation failed (empty response)' }, { status: 500 });
    }

    // 4b) Sanitize hallucinated amenities against inputs
    listing = sanitizeAgainstFacts(listing, body);
    if (!listing) {
      await refund();
      return NextResponse.json({ error: 'Generation failed after sanitization.' }, { status: 500 });
    }

    // 5) Minimal insert first (avoid schema mismatch), then optional patch
    const minimal = {
      user_id: user.id,
      title: body.address || 'Untitled',
      description: listing,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('listings')
      .insert([minimal])
      .select('*')
      .single();

    if (insertErr || !inserted) {
      await refund();
      return NextResponse.json({ error: `DB insert failed: ${insertErr?.message || 'unknown'}` }, { status: 500 });
    }

    // Best-effort update of optional fields (ignore errors)
    try {
      await supabase
        .from('listings')
        .update({
          address: body.address ?? null,
          bedrooms: body.bedrooms ?? null,
          bathrooms: body.bathrooms ?? null,
          squareFeet: body.squareFeet ?? null,
          features: body.features ?? null,
          tone: body.tone ?? null,
          translate: body.translate ?? null,
          neighborhood: body.neighborhood ?? null,
          interiorStyle: body.interiorStyle ?? null,
          renovations: body.renovations ?? null,
          outdoorFeatures: body.outdoorFeatures ?? null,
          nearbyAmenities: body.nearbyAmenities ?? null,
          hoaInfo: body.hoaInfo ?? null,
        })
        .eq('id', inserted.id);
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({ listing, saved: inserted });
  } catch (err: any) {
    await refund();
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
