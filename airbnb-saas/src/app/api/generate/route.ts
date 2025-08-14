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
  includeAmenities: boolean;
  includeNeighborhood: boolean;
  includeRules: boolean;
  includePhotos: boolean;
};

function sys() {
  return [
    {
      role: "system",
      content:
        "You are an expert short-term rental copywriter. Write clear, sensory, specific copy that drives bookings. Avoid clichés, exaggeration, emoji, and protected-class language. Use active voice. Do not invent unavailable amenities or claims.",
    },
  ];
}

function user(facts: string, o: Options, parts?: string[], tweak?: string) {
  const wants = parts?.length
    ? parts
    : [
        "title",
        "summary",
        "description",
        "highlights",
        "sections",
        "amenities",
        "neighborhood",
        "rules",
        "photos",
        "social",
        "seo",
      ];

  const titleLimit = o.platform === "Airbnb" ? 32 : o.platform === "VRBO" ? 60 : 70;

  return [
    {
      role: "user",
      content:
        `FACTS (verbatim):\n${facts}\n\n` +
        `AUDIENCE: ${o.audience}\nTONE: ${o.tone}\nLANGUAGE: ${o.language}\nPLATFORM: ${o.platform} (title ~${titleLimit} chars)\nSEASON: ${o.season}\nUNITS: ${o.unit}\n` +
        (tweak ? `REFINEMENT REQUEST: ${tweak}\n` : "") +
        `DESCRIPTION WORD BUDGET: ~${o.wordBudget}\n\n` +
        `OUTPUT: Valid JSON only, keys as below (omit keys not requested or disabled by include* flags):\n{\n` +
        `  "titlePrimary": "<best single title>",\n` +
        `  "titles": ["Alt A", "Alt B", "Alt C"],\n` +
        `  "summary": "<2-3 sentences overview>",\n` +
        `  "description": "<2–4 short paragraphs, ${o.wordBudget} words, first sentence = concrete benefit>",\n` +
        `  "highlights": ["bullet 1","bullet 2","..."],\n` +
        `  "sections": { "space": "<the space>", "access": "<guest access>", "notes": "<other things to note>" },\n` +
        `  "amenities": ["Wi-Fi","Parking","Workspace","..."],\n` +
        `  "neighborhood": "<nearby attractions, walkability>",\n` +
        `  "rules": "<house rules in friendly tone>",\n` +
        `  "photoCaptions": ["Living room with ...","Balcony sunset ..."],\n` +
        `  "social": { "x": "<≤180 chars>", "instagram": "<concise caption>" },\n` +
        `  "seo": ["neighborhood","property type","standout amenity"],\n` +
        `  "meta": { "word_count": <int>, "reading_time_sec": <int> }\n}\n\n` +
        `INSTRUCTIONS:\n` +
        `- Use only details present or clearly implied by FACTS.\n` +
        `- Avoid clichés (e.g., "nestled", "oasis") and sensitive/protected-class terms.\n` +
        `- Titles must be concrete; aim for ≤ ${titleLimit} chars for ${o.platform}.\n` +
        `- Language must be ${o.language}. Return VALID JSON without code fences or comments.\n` +
        `- Requested sections: ${wants.join(", ")}.\n` +
        (o.includeTitle ? "" : "- Omit titlePrimary and titles.\n") +
        (o.includeHighlights ? "" : "- Omit highlights.\n") +
        (o.includeCaption ? "" : "- Omit social.\n") +
        (o.includeSEO ? "" : "- Omit seo.\n") +
        (o.includeSections ? "" : "- Omit sections.\n") +
        (o.includeAmenities ? "" : "- Omit amenities.\n") +
        (o.includeNeighborhood ? "" : "- Omit neighborhood.\n") +
        (o.includeRules ? "" : "- Omit rules.\n") +
        (o.includePhotos ? "" : "- Omit photoCaptions.\n")
    },
  ];
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      facts?: string;
      options?: Options;
      requestParts?: string[];
      tweak?: string;
    };

    const facts = (body.facts || "").trim();
    if (facts.length < 100) {
      return NextResponse.json(
        { error: "Please provide more property detail (≥ 100 chars)." },
        { status: 400 }
      );
    }

    const o: Options = Object.assign(
      {
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
        includeAmenities: true,
        includeNeighborhood: true,
        includeRules: true,
        includePhotos: true,
      } as Options,
      body.options || {}
    );

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const messages = [...sys(), ...user(facts, o, body.requestParts, body.tweak)];

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 1100,
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return NextResponse.json(
        { error: `Provider error: ${resp.status} ${text}` },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";

    let parsed: any = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Model returned invalid JSON" }, { status: 502 });
    }

    // Normalize
    const result = {
      titlePrimary: typeof parsed.titlePrimary === "string" ? parsed.titlePrimary.trim() : undefined,
      titles: Array.isArray(parsed.titles) ? parsed.titles.map(String).filter(Boolean).slice(0, 5) : undefined,
      summary: typeof parsed.summary === "string" ? parsed.summary.trim() : undefined,
      description: typeof parsed.description === "string" ? parsed.description.trim() : undefined,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.map(String).filter(Boolean).slice(0, 12) : undefined,
      sections:
        parsed.sections && typeof parsed.sections === "object"
          ? {
              space: parsed.sections.space ? String(parsed.sections.space) : undefined,
              access: parsed.sections.access ? String(parsed.sections.access) : undefined,
              notes: parsed.sections.notes ? String(parsed.sections.notes) : undefined,
            }
          : undefined,
      amenities: Array.isArray(parsed.amenities) ? parsed.amenities.map(String).filter(Boolean).slice(0, 30) : undefined,
      neighborhood: typeof parsed.neighborhood === "string" ? parsed.neighborhood.trim() : undefined,
      rules: typeof parsed.rules === "string" ? parsed.rules.trim() : undefined,
      photoCaptions: Array.isArray(parsed.photoCaptions) ? parsed.photoCaptions.map(String).filter(Boolean).slice(0, 12) : undefined,
      social:
        parsed.social && typeof parsed.social === "object"
          ? {
              x: parsed.social.x ? String(parsed.social.x) : undefined,
              instagram: parsed.social.instagram ? String(parsed.social.instagram) : undefined,
            }
          : undefined,
      seo: Array.isArray(parsed.seo) ? parsed.seo.map(String).filter(Boolean).slice(0, 20) : undefined,
      meta:
        parsed.meta && typeof parsed.meta === "object"
          ? { word_count: parsed.meta.word_count, reading_time_sec: parsed.meta.reading_time_sec }
          : undefined,
    };

    return NextResponse.json({ result });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
