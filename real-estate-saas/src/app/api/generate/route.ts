// src/app/api/generate/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { address, bedrooms, bathrooms, squareFeet, features, tone, translate } = await req.json();

    const prompt = `
Write a compelling real estate listing for the following property:

Address: ${address}
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
Square Feet: ${squareFeet}
Features: ${features}
Tone: ${tone}
${translate ? 'Include a Spanish translation at the end.' : ''}
`;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OpenAI API Key' }, { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    console.log("GPT API raw response:", data);

    if (data.choices && data.choices.length > 0) {
      return NextResponse.json({ listing: data.choices[0].text });
    } else {
      return NextResponse.json({ listing: null });
    }

  } catch (error) {
    console.error("Error in /api/generate:", error);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
