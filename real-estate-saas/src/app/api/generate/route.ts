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

  let prompt = `Write a compelling Airbnb-style property listing in ~150-200 words. Use a ${tone?.toLowerCase() || 'professional'} tone and structure it like a high-quality Airbnb description: 2–3 vivid, engaging paragraphs followed by a persuasive closing line. Do not say "undefined" — if info is missing, smoothly skip it.

Details to include:
- The property is located at ${address || '[no address provided]'}, in the ${neighborhood || '[neighborhood unspecified]'} neighborhood.
- It has ${bedrooms || '?'} bedrooms, ${bathrooms || '?'} bathrooms, and approximately ${squareFeet || '?'} square feet.
- Interior style: ${interiorStyle}
- Renovations: ${renovations}
- Outdoor features: ${outdoorFeatures}
- Special features: ${features}
- Nearby amenities: ${nearbyAmenities}
- HOA info: ${hoaInfo}

Focus on what makes this place a unique, relaxing, or luxurious stay. Make it feel aspirational and inviting for short-term renters.`;

  if (translate) {
    prompt += `\n\nThen, provide a Spanish translation of the entire listing, using the same tone and formatting.`;
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
