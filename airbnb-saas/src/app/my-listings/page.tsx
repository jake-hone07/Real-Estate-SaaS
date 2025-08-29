// src/app/my-listings/page.tsx
import Link from 'next/link';
import { requireSession } from '@/lib/require-session';
import ListingCard from '@/components/ListingCard';

export const dynamic = 'force-dynamic';

export default async function MyListingsPage() {
  const { user, supabase } = await requireSession();

  const { data: listings, error } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Listings</h1>
        <Link href="/generate" className="underline text-sm">Generate new →</Link>
      </div>

      {!listings?.length && (
        <p className="opacity-70">
          No listings yet. <Link className="underline" href="/generate">Generate one</Link>.
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(listings ?? []).map((l: any) => <ListingCard key={l.id} listing={l} />)}
      </ul>
    </main>
  );
}
