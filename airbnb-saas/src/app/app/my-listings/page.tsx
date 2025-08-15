import { requireSession } from '@/lib/require-session';
import { revalidatePath } from 'next/cache';

export default async function MyListingsPage() {
  const { user, supabase } = await requireSession();
  const { data: listings, error } = await (await supabase)
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  async function deleteListing(formData: FormData) {
    'use server';
    const { supabase } = await requireSession();
    const id = formData.get('id') as string;
    await (await supabase).from('listings').delete().eq('id', id);
    revalidatePath('/app/my-listings');
  }

  async function updateListing(formData: FormData) {
    'use server';
    const { supabase } = await requireSession();
    const id = formData.get('id') as string;
    const title = formData.get('title') as string;
    const summary = formData.get('summary') as string;
    await (await supabase).from('listings').update({ title, summary, updated_at: new Date().toISOString() }).eq('id', id);
    revalidatePath('/app/my-listings');
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">My Listings</h1>
      {!listings?.length && <p>No listings yet. <a className="underline" href="/app">Generate one →</a></p>}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings?.map((l) => (
          <li key={l.id} className="border rounded p-4 space-y-3">
            <form action={updateListing} className="space-y-2">
              <input type="hidden" name="id" value={l.id} />
              <input className="w-full border p-2 rounded" name="title" defaultValue={l.title} />
              <textarea className="w-full border p-2 rounded" name="summary" defaultValue={l.summary} rows={4} />
              <div className="flex gap-2">
                <button className="border px-3 py-2 rounded" type="submit">Save</button>
                <form action={deleteListing}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="border px-3 py-2 rounded" type="submit">Delete</button>
                </form>
              </div>
            </form>
            <div className="text-sm text-gray-500">
              {l.city ? `${l.city}, ${l.state ?? ''} ${l.country ?? ''}` : ''}
            </div>
            <pre className="text-xs overflow-auto border rounded p-2">{JSON.stringify(l.amenities ?? [], null, 2)}</pre>
          </li>
        ))}
      </ul>
    </main>
  );
}
