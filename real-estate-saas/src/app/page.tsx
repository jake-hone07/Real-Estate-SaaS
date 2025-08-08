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
    const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

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

     <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-xl">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <input
      name="address"
      placeholder="Address"
      value={form.address}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="bedrooms"
      placeholder="Bedrooms"
      value={form.bedrooms}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="bathrooms"
      placeholder="Bathrooms"
      value={form.bathrooms}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="squareFeet"
      placeholder="Square Feet"
      value={form.squareFeet}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="price"
      placeholder="Price"
      value={form.price}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="features"
      placeholder="Key Features"
      value={form.features}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="tone"
      placeholder="Tone (e.g. cozy, elegant, modern)"
      value={form.tone}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <div className="flex items-center gap-2 px-2">
      <input
        type="checkbox"
        name="translate"
        checked={form.translate}
        onChange={handleChange}
        className="w-4 h-4"
      />
      <label className="text-white text-sm">Translate to Spanish</label>
    </div>
    <input
      name="neighborhood"
      placeholder="Neighborhood"
      value={form.neighborhood}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="interiorStyle"
      placeholder="Interior Style"
      value={form.interiorStyle}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="renovations"
      placeholder="Recent Renovations"
      value={form.renovations}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="outdoorFeatures"
      placeholder="Outdoor Features"
      value={form.outdoorFeatures}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="nearbyAmenities"
      placeholder="Nearby Amenities"
      value={form.nearbyAmenities}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
    <input
      name="hoaInfo"
      placeholder="HOA Info"
      value={form.hoaInfo}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded border border-gray-300 bg-white text-black"
    />
  </div>

  <button
    type="submit"
    disabled={loading}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full transition"
  >
    {loading ? 'Generating...' : 'Generate Listing'}
  </button>
</form>




      {error && <p className="text-red-600 mt-4">{error}</p>}

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

      <RecentListings />
    </main>
  );
}
