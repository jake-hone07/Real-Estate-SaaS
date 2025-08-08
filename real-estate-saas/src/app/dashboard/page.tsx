'use client';

import { useEffect, useState } from 'react';
import ListingForm from '@/components/ListingForm';
import { supabase, addListing } from '@/lib/supabase';

interface FormData {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  features: string;
  tone: string;
  translate: boolean;
  neighborhood: string;
  interiorStyle: string;
  renovations: string;
  outdoorFeatures: string;
  amenitiesNearby: string;
  hoaInfo: string;
}

export default function DashboardPage() {
  const [listing, setListing] = useState<string | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchListings = async () => {
    setLoadingListings(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching listings:', error.message);
    } else {
      setListings(data || []);
    }

    setLoadingListings(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleGenerate = async (formData: FormData) => {
    setSaving(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      const generatedText = data.listing;

      if (!generatedText) {
        setListing('⚠️ No listing generated.');
        return;
      }

      setListing(generatedText);

      await addListing({
        title: formData.address || 'Untitled Listing',
        description: generatedText,
        address: formData.address,
        price: 0,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        squareFeet: formData.squareFeet,
        features: formData.features,
        tone: formData.tone,
        translate: formData.translate,
        neighborhood: formData.neighborhood,
        interiorStyle: formData.interiorStyle,
        renovations: formData.renovations,
        outdoorFeatures: formData.outdoorFeatures,
        nearbyAmenities: formData.amenitiesNearby,
        hoaInfo: formData.hoaInfo,
      });

      console.log('✅ Listing saved to Supabase');
      alert('✅ Listing saved!');
      fetchListings();
    } catch (err) {
      console.error('❌ Error saving listing:', err);
      alert('❌ Failed to save listing.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">🏡 Listing Generator</h1>

      <ListingForm onGenerate={handleGenerate} />

      {listing && (
        <div className="mt-6 p-6 bg-white border rounded shadow-lg space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">New Listing:</h2>
          <h3 className="text-xl font-bold text-blue-600">
            {listing.split('\n')[0]}
          </h3>
          <p className="text-gray-700 whitespace-pre-line">
            {listing.split('\n').slice(1).join('\n')}
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(listing);
              alert('📋 Listing copied to clipboard!');
            }}
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Copy to Clipboard
          </button>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-10 mb-4">📜 Saved Listings</h2>
      {loadingListings ? (
        <p>Loading listings...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500">No listings saved yet.</p>
      ) : (
        <div className="space-y-4">
          {listings.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white rounded shadow border"
            >
              <h3 className="text-blue-600 font-semibold text-lg">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                {item.description.slice(0, 120)}...
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(item.description);
                  alert('Copied!');
                }}
                className="text-sm text-blue-500 hover:underline"
              >
                Copy Full Listing
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
