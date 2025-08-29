// src/app/api/listings/route.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/require-session';

export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireSession();
    const body = await req.json();

    // Expected payload from the generator
    const {
      title,
      description,
      address,
      price,
      bedrooms,
      bathrooms,
      squareFeet,
      tone,
      content_json,   // <- full structured result
    } = body ?? {};

    const { data, error } = await supabase
      .from('listings')
      .insert([{
        user_id: user.id,
        title: title ?? null,
        description: description ?? null,
        address: address ?? null,
        price: typeof price === 'number' ? price : null,
        bedrooms: typeof bedrooms === 'number' ? bedrooms : null,
        bathrooms: typeof bathrooms === 'number' ? bathrooms : null,
        squareFeet: typeof squareFeet === 'number' ? squareFeet : null,
        tone: tone ?? null,
        content_json: content_json ?? null,
      }])
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ id: data?.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Create failed' }, { status: 500 });
  }
}
