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
  address, beds, baths, squareFeet, features, tone, translate,
  neighborhood, interiorStyle, renovations, outdoorFeatures,nearbyAmenities, hoaInfo
} = body;


   let prompt = `You're a professional real estate listing writer. Based ONLY on the facts provided, write a compelling and truthful property listing that highlights the lifestyle, features, and unique appeal.

Return a listing with:
• A short, catchy headline
• A persuasive but accurate description (max 150 words)
• No made-up features — only describe what's included.

Property details:
- Address: ${address}
- Bedrooms: ${beds}, Bathrooms: ${baths}, SqFt: ${squareFeet}
- Interior Style: ${interiorStyle}
- Renovations: ${renovations}
- Features: ${features}
- Outdoor: ${outdoorFeatures}
- Neighborhood: ${neighborhood}
- Nearby Amenities: ${nearbyAmenities}
- Tone: ${tone}

Keep the tone ${tone.toLowerCase()} and modern. Avoid exaggeration or repetition.`;

if (translate) {
  prompt += `\n\nThen provide a fluent Spanish translation of the full listing.`;
}



    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const listing = response.choices[0]?.message?.content;
    console.log("Generated listing:", listing);

    return NextResponse.json({ listing });
 } catch (error: unknown) {
  if (error instanceof Error) {
    console.error("Error generating listing:", error.message);
    return NextResponse.json({ listing: null, error: error.message }, { status: 500 });
  } else {
    console.error("Unknown error generating listing:", error);
    return NextResponse.json({ listing: null, error: "Unknown error" }, { status: 500 });
  }
}

}

