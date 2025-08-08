'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase as clientSupabase, addListing } from '@/lib/supabase';
import ListingForm from '@/components/ListingForm';

export default function ClientDashboard() {
  const [listing, setListing] = useState<string | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  const fetchListings = async () => {
    setLoadingListings(true);
    const { data, error } = await clientSupabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching listings:', error.message);
      toast.error('Failed to load listings.');
    } else {
      setListings(data || []);
    }

    setLoadingListings(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleGenerate = async (formData: any) => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    const generatedText = data.listing;

    if (!generatedText) {
      setListing('⚠️ No listing generated.');
      toast.error('Failed to generate listing.');
      return;
    }

    setListing(generatedText);

    try {
      await addListing({
        title: formData.address || 'Untitled',
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

      toast.success('✅ Listing saved!');
      fetchListings();
    } catch (err) {
      console.error('❌ Error saving listing:', err);
      toast.error('Failed to save listing.');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await clientSupabase.from('listings').delete().eq('id', id);
    if (error) {
      console.error('❌ Failed to delete listing:', error.message);
      toast.error('Failed to delete listing.');
    } else {
      setListings((prev) => prev.filter((item) => item.id !== id));
      toast.success('🗑️ Listing deleted');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('📋 Copied to clipboard!');
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">🏡 Listing Generator</h1>

      <ListingForm onGenerate={handleGenerate} />

      {listing && (
        <div className="mt-6 p-6 bg-white rounded shadow">
          <h2 className="font-semibold text-lg">Generated Listing</h2>
          <pre className="whitespace-pre-wrap text-gray-700">{listing}</pre>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-10 mb-4">📜 Your Saved Listings</h2>
      {loadingListings ? (
        <p>Loading...</p>
      ) : listings.length === 0 ? (
        <p className="text-gray-500">No listings yet.</p>
      ) : (
        <div className="space-y-4">
          {listings.map((item) => (
            <div key={item.id} className="p-4 bg-white rounded shadow">
              <h3 className="font-semibold text-blue-600">{item.title}</h3>
              <p className="text-sm text-gray-600">
                {(item.description || 'No description').slice(0, 100)}...
              </p>
              <div className="mt-2 space-x-4">
                <button
                  className="text-sm text-blue-500 hover:underline"
                  onClick={() => handleCopy(item.description)}
                >
                  Copy
                </button>
                <button
                  className="text-sm text-red-500 hover:underline"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
