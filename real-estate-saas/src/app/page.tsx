'use client';

import { useState } from 'react';
import { addListing } from '@/lib/supabase';
import RecentListings from '@/components/RecentListings';

type FormState = {
  address: string;
  bedrooms: string;
  bathrooms: string;
  squareFeet: string;
  price: string;
  features: string;
  tone: string;
  translate: boolean;
  neighborhood: string;
  interiorStyle: string;
  renovations: string;
  outdoorFeatures: string;
  nearbyAmenities: string;
  hoaInfo: string;
};

export default function Home() {
  const [form, setForm] = useState<FormState>({
    address: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    price: '',
    features: '',
    tone: '',
    translate: false,
    neighborhood: '',
    interiorStyle: '',
    renovations: '',
    outdoorFeatures: '',
    nearbyAmenities: '',
    hoaInfo: '',
  });

  const [generatedListing, setGeneratedListing] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, type, value } = e.target;

  const inputValue =
    type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : value;

  setForm((prev) => ({
    ...prev,
    [name]: inputValue,
  }));
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setGeneratedListing('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data?.listing) {
        throw new Error(data?.error || 'Something went wrong while generating.');
      }

      setGeneratedListing(data.listing);

      await addListing({
        title: form.address || 'Untitled Listing',
        description: data.listing,
        address: form.address,
        price: Number(form.price),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        squareFeet: Number(form.squareFeet),
        features: form.features,
        tone: form.tone,
        translate: form.translate,
        neighborhood: form.neighborhood,
        interiorStyle: form.interiorStyle,
        renovations: form.renovations,
        outdoorFeatures: form.outdoorFeatures,
        nearbyAmenities: form.nearbyAmenities,
        hoaInfo: form.hoaInfo,
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">AirB&B Description Generator</h1>

      {/* Listing Form */}
      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-xl">
        {/* (same fieldset structure as you pasted — keep it exactly as-is, it’s 🔥) */}
        {/* Don’t forget to paste back your full fieldset form code here if needed */}
        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full mt-4"
        >
          {loading ? 'Generating...' : 'Generate Listing'}
        </button>
      </form>

      {/* Error */}
      {error && <p className="text-red-600 mt-4">{error}</p>}

      {/* Generated Output */}
      {generatedListing && (
        <div className="mt-6 p-6 bg-white border rounded-xl shadow-lg space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 text-center">🏠 Generated Listing</h2>
          <h3 className="text-2xl font-bold text-center text-blue-700">
            {generatedListing.split('\n')[0]}
          </h3>
          <div className="text-gray-700 whitespace-pre-line font-mono leading-relaxed tracking-wide">
            {generatedListing.split('\n').slice(1).join('\n')}
          </div>
          <div className="text-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedListing);
                alert('✅ Copied to clipboard!');
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              📋 Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Recent Listings */}
      <RecentListings />
    </main>
  );
}
