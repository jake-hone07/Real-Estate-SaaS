import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Support both form posts and JSON
    const contentType = req.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await req.json()
      : Object.fromEntries(await (req as any).formData?.() ?? (await req.formData()));

    const payload = {
      user_id: user.id,
      title: body.title as string,
      summary: body.summary as string,
      amenities: body.amenities ? JSON.parse(typeof body.amenities === 'string' ? body.amenities : '[]') : [],
      city: (body.city || null) as string | null,
      state: (body.state || null) as string | null,
      country: (body.country || null) as string | null,
    };

    const { data, error } = await supabase.from('listings').insert(payload).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unknown error' }, { status: 500 });
  }
}
