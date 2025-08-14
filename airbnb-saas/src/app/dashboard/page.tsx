'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, useSessionContext } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import { supabase as clientSupabase } from '@/lib/supabase';

type CreditResp = { balance: number } | { error: string };

export default function DashboardPage() {
  const session = useSession();
  const { isLoading } = useSessionContext();
  const router = useRouter();

  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);

  useEffect(() => {
    if (!isLoading && !session) router.replace('/login');
  }, [isLoading, session, router]);

  const fetchCredits = async () => {
    setLoadingCredits(true);
    try {
      const res = await fetch('/api/credits', { cache: 'no-store' });
      const json = (await res.json()) as CreditResp;
      if (!res.ok || 'error' in json) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      setCredits((json as any).balance ?? 0);
    } catch {
      setCredits(null);
    } finally {
      setLoadingCredits(false);
    }
  };

  const fetchListings = async () => {
    setLoadingListings(true);
    const { data } = await clientSupabase
      .from('listings')
      .select('id, title, description, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    setListings(data || []);
    setLoadingListings(false);
  };

  useEffect(() => {
    if (!isLoading && session?.user) {
      fetchCredits();
      fetchListings();
    }
  }, [isLoading, session]);

  useEffect(() => {
    const onFocus = () => {
      fetchCredits();
      fetchListings();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse text-sm text-gray-600">Loading…</div>
      </main>
    );
  }
  if (!session) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-gray-600">View credits and your recent listings.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border px-3 py-2 text-sm bg-white shadow-sm">
            Credits:{' '}
            {loadingCredits ? (
              <span className="text-gray-500">…</span>
            ) : credits === null ? (
              <span className="text-red-600">unavailable</span>
            ) : (
              <span className="font-semibold">{credits}</span>
            )}
          </div>
          {/* Use Link for bulletproof client navigation */}
          <Link
            href="/generate"
            className="rounded-lg border px-3 py-2 text-sm bg-white shadow-sm hover:bg-gray-50"
          >
            + Generate
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border px-3 py-2 text-sm bg-white shadow-sm hover:bg-gray-50"
          >
            Pricing
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3 font-medium">Your Saved Listings</div>
        {loadingListings ? (
          <div className="p-4 text-sm text-gray-600">Loading…</div>
        ) : listings.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">
            No listings yet. Click <span className="font-medium">+ Generate</span> to create your first one.
          </div>
        ) : (
          <div className="divide-y">
            {listings.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div>
                  <div className="font-medium text-blue-600">{item.title}</div>
                  <div className="mt-1 line-clamp-2 text-sm text-gray-700">
                    {item.description || 'No description'}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => {
                      navigator.clipboard.writeText(item.description || '');
                      alert('Copied to clipboard');
                    }}
                  >
                    Copy
                  </button>
                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={async () => {
                      const { error } = await clientSupabase.from('listings').delete().eq('id', item.id);
                      if (!error) setListings((prev) => prev.filter((x) => x.id !== item.id));
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
