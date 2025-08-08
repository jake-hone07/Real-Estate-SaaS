'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Listing {
  id: string;
  title?: string;
  description?: string;
  is_favorite?: boolean;
  created_at?: string;
  [key: string]: any;
}

export default function RecentListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching listings:', error.message);
      } else {
        setListings(data ?? []);
      }
      setLoading(false);
    };

    fetchListings();
  }, []);

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isFavorite: !isFavorite }),
      });

      if (!res.ok) throw new Error('Failed to update favorite');

      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, is_favorite: !isFavorite } : l))
      );
    } catch (err) {
      console.error(err);
      alert('Failed to update favorite status');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteListing = async (id: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this listing?');
    if (!confirmDelete) return;

    setUpdatingId(id);
    const { error } = await supabase.from('listings').delete().eq('id', id);

    if (error) {
      alert('Failed to delete listing.');
    } else {
      setListings((prev) => prev.filter((l) => l.id !== id));
    }
    setUpdatingId(null);
  };

  if (loading) return <p>Loading recent listings...</p>;

  if (listings.length === 0) {
    return <p className="text-gray-500 mt-4">No listings found.</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4">🕘 Recent Listings</h2>
      <div className="space-y-4">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white p-4 rounded shadow space-y-2">
            <h3 className="text-xl font-bold text-blue-600">
              {listing.title || listing.description?.split('\n')[0]}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {listing.description?.split('\n').slice(1).join('\n')}
            </p>

            <div className="flex items-center gap-4">
              <button
                disabled={updatingId === listing.id}
                className={`text-sm px-3 py-1 rounded border ${
                  listing.is_favorite ? 'bg-yellow-400 text-white' : 'bg-white text-gray-700'
                }`}
                onClick={() => toggleFavorite(listing.id, listing.is_favorite ?? false)}
              >
                {listing.is_favorite ? '★ Favorited' : '☆ Favorite'}
              </button>

              <button
                disabled={updatingId === listing.id}
                className="text-sm text-red-500 underline"
                onClick={() => deleteListing(listing.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
