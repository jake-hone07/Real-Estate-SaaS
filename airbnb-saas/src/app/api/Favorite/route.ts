// src/app/api/Favorite/route.ts
import { NextResponse } from 'next/server';
import { createServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = await createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Optional payload: { listingId: number, action?: 'add' | 'remove' }
  const { listingId, action } = await req.json();

  if (!listingId) {
    return NextResponse.json({ error: 'Missing listingId' }, { status: 400 });
  }

  // If you have a "favorites" table, this will toggle it.
  if (action === 'remove') {
    await supabase.from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);
  } else {
    await supabase.from('favorites')
      .upsert({ user_id: user.id, listing_id: listingId }, { onConflict: 'user_id,listing_id' });
  }

  return NextResponse.json({ ok: true });
}
