'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Listing {
  id: string;
  title: string;
  description: string;
  is_favorite?: boolean;
  [key: string]: any;
}

export default function RecentListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
      } else {
        setListings(data || []);
      }
      setLoading(false);
    };

    fetchListings();
  }, []);

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

            {/* Favorite button */}
            <button
              className={`text-sm px-3 py-1 rounded border ${
                listing.is_favorite ? 'bg-yellow-400 text-white' : 'bg-white text-gray-700'
              }`}
              onClick={async () => {
                try {
                  const res = await fetch('/api/favorite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: listing.id, isFavorite: !listing.is_favorite }),
                  });
                  if (!res.ok) throw new Error('Failed to update favorite');
                  location.reload();
                } catch (err) {
                  console.error(err);
                  alert('Failed to update favorite status');
                }
              }}
            >
              {listing.is_favorite ? '★ Favorited' : '☆ Favorite'}
            </button>

            {/* Delete button */}
            <button
              className="text-sm text-red-500 underline mt-2"
              onClick={async () => {
                const confirmDelete = confirm("Are you sure you want to delete this listing?");
                if (!confirmDelete) return;

                const { error } = await supabase.from("listings").delete().eq("id", listing.id);
                if (error) {
                  alert("Failed to delete listing.");
                } else {
                  location.reload(); // Refresh to remove from view
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
