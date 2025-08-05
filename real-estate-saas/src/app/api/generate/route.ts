// app/api/generate/route.ts
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { address, beds, baths, squareFeet, features, tone, translate } = body;

    // Build the prompt based on input
    let prompt = `Write a real estate listing for the following home:
`;
    prompt += `Address: ${address}
`;
    prompt += `Beds: ${beds}, Baths: ${baths}, SqFt: ${squareFeet}
`;
    prompt += `Features: ${features}
`;
    prompt += `Tone: ${tone}
`;
    if (translate) {
      prompt += ` Also provide a Spanish translation.`;
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

