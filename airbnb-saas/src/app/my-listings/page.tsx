// src/app/my-listings/page.tsx
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/require-session';
import { createServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function MyListingsPage() {
  const { supabase } = await requireSession();

  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  // --- server actions (must create a fresh server client inside the action) ---
  async function updateListing(formData: FormData) {
    'use server';
    const supabase = await createServer();

    const id = Number(formData.get('id'));
    const title = String(formData.get('title') ?? '');
    const summary = String(formData.get('summary') ?? '');

    const { error } = await supabase
      .from('listings')
      .update({ title, summary, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/app/my-listings');
  }

  async function deleteListing(formData: FormData) {
    'use server';
    const supabase = await createServer();

    const id = Number(formData.get('id'));
    const { error } = await supabase.from('listings').delete().eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/app/my-listings');
  }
  // ---------------------------------------------------------------------------

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Listings</h1>
        <Link href="/generate" className="underline">Generate new →</Link>
      </div>

      {!listings?.length && (
        <p>No listings yet. <Link className="underline" href="/generate">Generate one →</Link></p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(listings ?? []).map((l: any) => (
          <li key={l.id} className="border rounded p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">{l.title || 'Untitled Listing'}</div>
                {l.address && <div className="opacity-70">{l.address}</div>}
                <div className="text-xs opacity-50">ID: {l.id}</div>
              </div>
              <Link href={`/listing/${l.id}`} className="underline text-sm">View</Link>
            </div>

            <div className="text-sm opacity-80">
              {l.bedrooms > 0 || l.bathrooms > 0 || l.squareFeet > 0 ? (
                <div className="mt-1">
                  {l.bedrooms > 0 && `${l.bedrooms} bd`} {l.bathrooms > 0 && `• ${l.bathrooms} ba`} {l.squareFeet > 0 && `• ${l.squareFeet} sqft`}
                </div>
              ) : null}
              {typeof l.price === 'number' && l.price > 0 && (
                <div className="mt-1 font-semibold">${l.price.toLocaleString()}</div>
              )}
            </div>

            {/* Single form: default action is update; Delete uses formAction */}
            <form action={updateListing} method="post" className="space-y-2">
              <input type="hidden" name="id" value={l.id} />
              <input className="w-full border p-2 rounded" name="title" defaultValue={l.title ?? ''} />
              <textarea className="w-full border p-2 rounded" name="summary" rows={4} defaultValue={l.summary ?? ''} />
              <div className="flex gap-2">
                <button type="submit" className="border px-3 py-2 rounded">Save</button>
                <button formAction={deleteListing} className="border px-3 py-2 rounded">Delete</button>
              </div>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
