// src/app/api/generate/route.ts
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { address, bedrooms, bathrooms, squareFeet, features, tone, translate } = await req.json();

    const basePrompt = `Write a real estate listing in a ${tone.toLowerCase()} tone for a property with the following details:
Address: ${address}
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
Square Feet: ${squareFeet}
Key Features: ${features}`;

    const messages: ChatCompletionMessageParam[] = [
  { role: "user", content: basePrompt }
];
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
    });

    const englishListing = completion.choices[0].message.content;

    if (!translate) {
      return NextResponse.json({ listing: englishListing });
    }

    const spanishPrompt = `Translate this real estate listing into Spanish:\n\n${englishListing}`;
    const translated = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: spanishPrompt }],
      temperature: 0.5,
    });

    const spanishListing = translated.choices[0].message.content;
    return NextResponse.json({ listing: spanishListing });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
