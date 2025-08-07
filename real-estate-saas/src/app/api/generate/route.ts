// app/api/generate/route.ts
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
    } = body;

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

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const listing = response.choices[0]?.message?.content;
    console.log("✅ Generated listing:", listing);

    return NextResponse.json({ listing });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Error generating listing:", error.message);
      return NextResponse.json({ listing: null, error: error.message }, { status: 500 });
    } else {
      console.error("❌ Unknown error:", error);
      return NextResponse.json({ listing: null, error: "Unknown error" }, { status: 500 });
    }
  }
}
