// src/app/api/listings/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/require-session';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const idNum = Number(params.id);
    if (!Number.isFinite(idNum)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

    const { supabase, user } = await requireSession();
    const body = await req.json();
    const { title, description } = body as { title?: string; description?: string };

    const patch: Record<string, any> = {};
    if (typeof title === 'string') patch.title = title;
    if (typeof description === 'string') patch.description = description;

    const { error } = await supabase
      .from('listings')
      .update(patch) // ← no updated_at (your table doesn’t have it)
      .eq('id', idNum)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const idNum = Number(params.id);
    if (!Number.isFinite(idNum)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

    const { supabase, user } = await requireSession();
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', idNum)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Delete failed' }, { status: 500 });
  }
}
