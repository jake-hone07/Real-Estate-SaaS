import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type ListingInput = {
  address?: string;
  bedrooms?: string;
  bathrooms?: string;
  squareFeet?: string;
  features?: string;
  tone?: string;
  translate?: boolean;
  neighborhood?: string;
  interiorStyle?: string;
  renovations?: string;
  outdoorFeatures?: string;
  nearbyAmenities?: string;
  hoaInfo?: string;
};

function buildPrompt(input: ListingInput): string {
  const {
    address,
    bedrooms,
    bathrooms,
    squareFeet,
    features,
    tone,
    translate,
    neighborhood,
    interiorStyle,
    renovations,
    outdoorFeatures,
    nearbyAmenities,
    hoaInfo,
  } = input;

  let prompt = `Write a short, professional, engaging real estate or vacation rental listing (~150-200 words) based on the following property details. Format it like a polished Airbnb description, with 2–3 short paragraphs and a persuasive closing sentence. Avoid mentioning "undefined" if any fields are blank.

Address: ${address}
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
Square Feet: ${squareFeet}
Neighborhood: ${neighborhood}
Interior Style: ${interiorStyle}
Recent Renovations: ${renovations}
Outdoor Features: ${outdoorFeatures}
Key Features: ${features}
Nearby Amenities: ${nearbyAmenities}
HOA Info: ${hoaInfo}
Tone: ${tone}

Focus on vivid, sensory-rich details, highlight what's unique about the space, and keep the flow natural.`;

  if (translate) {
    prompt += ` After the English version, provide a professional Spanish translation that matches the same tone.`;
  }

  return prompt;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ListingInput;
    const prompt = buildPrompt(body);

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const listing = response.choices?.[0]?.message?.content ?? null;

    console.log("✅ Generated listing:", listing?.slice(0, 100) + "...");

    return NextResponse.json({ listing });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error generating listing:", message);

    return NextResponse.json({ listing: null, error: message }, { status: 500 });
  }
}
