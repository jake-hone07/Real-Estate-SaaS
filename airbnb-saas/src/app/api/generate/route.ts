import { NextResponse } from "next/server";

export const runtime = "edge";

type Options = {
  tone: string;
  audience: string;
  wordBudget: number;
  language: string;
  platform: "Airbnb" | "VRBO" | "Booking";
  season?: "Default" | "Spring" | "Summer" | "Fall" | "Winter";
  unit: "imperial" | "metric";
  includeTitle: boolean;
  includeHighlights: boolean;
  includeCaption: boolean;
  includeSEO: boolean;
  includeSections: boolean;
};

function system() {
  return [{
    role: "system",
    content:
      "You are an expert short-term rental copywriter. Write clear, sensory, specific copy that drives bookings. Avoid clichés, exaggeration, emoji, and protected-class mentions. American English by default unless another language is requested. Prefer active voice and concrete details."
  }];
}

function buildUserPrompt(facts: string, options: Options, parts?: string[], tweak?: string) {
  const wants = parts && parts.length ? parts : ["description", "titles", "highlights", "sections", "social", "seo"];
  const titleLimit = options.platform === "Airbnb" ? 32 : options.platform === "VRBO" ? 60 : 70;

  return [{
    role: "user",
    content:
      `FACTS (verbatim):\n${facts}\n\n` +
      `AUDIENCE: ${options.audience}\n` +
      `TONE: ${options.tone}\n` +
      `LANGUAGE: ${options.language}\n` +
      `PLATFORM: ${options.platform} (title limit ≈ ${titleLimit} chars)\n` +
      `SEASON: ${options.season || "Default"}\n` +
      `UNITS: ${options.unit}\n` +
      (tweak ? `REFINEMENT REQUEST: ${tweak}\n` : "") +
      `DESCRIPTION WORD BUDGET: ~${options.wordBudget}\n\n` +
      `OUTPUT: Valid JSON with these keys (omit any not requested or excluded by include* flags):\n` +
      `{\n` +
      `  "description": "<2–4 short paragraphs, ${options.wordBudget} words, first sentence = concrete benefit>",\n` +
      `  "titles": ["Title A","Title B","Title C"],\n` +
      `  "highlights": ["bullet 1", "bullet 2", "..."],\n` +
      `  "sections": { "space": "<the space>", "access": "<guest access>", "notes": "<other things to note>"},\n` +
      `  "social": { "x": "<≤180 chars>", "instagram": "<concise caption>" },\n` +
      `  "seo": ["neighborhood","amenity","nearby attraction"],\n` +
      `  "meta": { "word_count": <int>, "reading_time_sec": <int> }\n` +
      `}\n\n` +
      `INSTRUCTIONS:\n` +
      `- Use only details present or clearly implied by FACTS; do not invent safe/unsafe claims.\n` +
      `- Avoid clichés (e.g., "nestled", "oasis") and protected-class language.\n` +
      `- Titles must be concrete and within ${titleLimit} chars where possible.\n` +
      `- Language must be ${options.language}.\n` +
      `- Return VALID JSON only. No code fences or commentary.\n` +
      `- Requested sections: ${wants.join(", ")}.\n` +
      (options.includeTitle ? "" : "- Omit 'titles'.\n") +
      (options.includeHighlights ? "" : "- Omit 'highlights'.\n") +
      (options.includeCaption ? "" : "- Omit 'social'.\n") +
      (options.includeSEO ? "" : "- Omit 'seo'.\n") +
      (options.includeSections ? "" : "- Omit 'sections'.\n")
  }];
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      facts?: string;
      options?: Options;
      requestParts?: string[];
      tweak?: string;
    };

    const facts = (body.facts || "").trim();
    if (facts.length < 100) {
      return NextResponse.json({ error: "Please provide more property detail (≥ 100 chars)." }, { status: 400 });
    }

    const options: Options = Object.assign({
      tone: "Warm & professional",
      audience: "Families & small groups",
      wordBudget: 180,
      language: "English",
      platform: "Airbnb",
      season: "Default",
      unit: "imperial",
      includeTitle: true,
      includeHighlights: true,
      includeCaption: true,
      includeSEO: true,
      includeSections: true,
    }, body.options || {});

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

    const messages = [...system(), ...buildUserPrompt(facts, options, body.requestParts, body.tweak)];

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 900,
        response_format: { type: "json_object" },
      })
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json({ error: `Provider error: ${resp.status} ${text}` }, { status: 502 });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";

    let parsed: any;
    try { parsed = JSON.parse(raw); }
    catch { return NextResponse.json({ error: "Model returned invalid JSON" }, { status: 502 }); }

    // Normalize output
    const result = {
      description: typeof parsed.description === "string" ? parsed.description.trim() : undefined,
      titles: Array.isArray(parsed.titles) ? parsed.titles.map(String).filter(Boolean).slice(0, 5) : undefined,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(String).filter(Boolean).slice(0, 12) : undefined,
      sections: parsed.sections && typeof parsed.sections === "object"
        ? {
            space: parsed.sections.space ? String(parsed.sections.space) : undefined,
            access: parsed.sections.access ? String(parsed.sections.access) : undefined,
            notes: parsed.sections.notes ? String(parsed.sections.notes) : undefined,
          } : undefined,
      social: parsed.social && typeof parsed.social === "object"
        ? {
            x: parsed.social.x ? String(parsed.social.x) : undefined,
            instagram: parsed.social.instagram ? String(parsed.social.instagram) : undefined,
          } : undefined,
      seo: Array.isArray(parsed.seo) ? parsed.seo.map(String).filter(Boolean).slice(0, 15) : undefined,
      meta: parsed.meta && typeof parsed.meta === "object" ? parsed.meta : undefined,
    };

    return NextResponse.json({ result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
