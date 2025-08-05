// src/app/api/generate/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { address, bedrooms, bathrooms, squareFeet, features, tone, translate } = await req.json();

    const basePrompt = `Write a real estate listing in a ${tone.toLowerCase()} tone for a property with the following details:
Address: ${address}
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
Square Feet: ${squareFeet}
Features: ${features}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: basePrompt }],
      temperature: 0.7,
    });

    const englishListing = completion.choices?.[0]?.message?.content ?? null;

    if (!englishListing) {
      return NextResponse.json({ error: 'Failed to generate English listing.' }, { status: 500 });
    }

    // Optional: Translate to Spanish
    if (translate) {
      const spanishPrompt = `Translate this real estate listing into Spanish:\n\n${englishListing}`;

      const translated = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: spanishPrompt }],
        temperature: 0.7,
      });

      const spanishListing = translated.choices?.[0]?.message?.content ?? null;

      return NextResponse.json({ listing: spanishListing });
    }

    return NextResponse.json({ listing: englishListing });

  } catch (err: any) {
    console.error('Error in /api/generate:', err);
    return NextResponse.json({ error: err.message || 'Unknown error occurred' }, { status: 500 });
  }
}
