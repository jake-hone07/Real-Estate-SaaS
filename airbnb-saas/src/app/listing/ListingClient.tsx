// src/app/listing/ListingClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NewListing } from '@/lib/supabase';

export default function ListingClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<NewListing>({
    title: '',
    description: '',
    address: '',
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    squareFeet: 0,
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

  function set<K extends keyof NewListing>(key: K, value: NewListing[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    // Ensure numeric fields are numbers (Zod expects numbers)
    const payload: NewListing = {
      ...form,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      squareFeet: Number(form.squareFeet),
    };

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to create listing');
      router.push('/my-listings');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create Listing</h1>

      <form className="grid grid-cols-1 gap-4" onSubmit={onSubmit}>
        <input className="border rounded p-2" placeholder="Title"
          value={form.title} onChange={e => set('title', e.target.value)} required />

        <textarea className="border rounded p-2" placeholder="Description"
          value={form.description} onChange={e => set('description', e.target.value)} required />

        <input className="border rounded p-2" placeholder="Address"
          value={form.address} onChange={e => set('address', e.target.value)} required />

        <div className="grid grid-cols-3 gap-3">
          <input className="border rounded p-2" placeholder="Price"
            type="number" value={form.price}
            onChange={e => set('price', Number(e.target.value))} required />
          <input className="border rounded p-2" placeholder="Bedrooms"
            type="number" value={form.bedrooms}
            onChange={e => set('bedrooms', Number(e.target.value))} required />
          <input className="border rounded p-2" placeholder="Bathrooms"
            type="number" value={form.bathrooms}
            onChange={e => set('bathrooms', Number(e.target.value))} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded p-2" placeholder="Square feet"
            type="number" value={form.squareFeet}
            onChange={e => set('squareFeet', Number(e.target.value))} required />
          <input className="border rounded p-2" placeholder="Features (comma-separated)"
            value={form.features} onChange={e => set('features', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded p-2" placeholder="Tone (e.g., luxury, friendly)"
            value={form.tone} onChange={e => set('tone', e.target.value)} />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.translate}
              onChange={e => set('translate', e.target.checked)} />
            Translate output
          </label>
        </div>

        {/* Optional fields */}
        <input className="border rounded p-2" placeholder="Neighborhood"
          value={form.neighborhood ?? ''} onChange={e => set('neighborhood', e.target.value)} />
        <input className="border rounded p-2" placeholder="Interior style"
          value={form.interiorStyle ?? ''} onChange={e => set('interiorStyle', e.target.value)} />
        <input className="border rounded p-2" placeholder="Renovations"
          value={form.renovations ?? ''} onChange={e => set('renovations', e.target.value)} />
        <input className="border rounded p-2" placeholder="Outdoor features"
          value={form.outdoorFeatures ?? ''} onChange={e => set('outdoorFeatures', e.target.value)} />
        <input className="border rounded p-2" placeholder="Nearby amenities"
          value={form.nearbyAmenities ?? ''} onChange={e => set('nearbyAmenities', e.target.value)} />
        <input className="border rounded p-2" placeholder="HOA info"
          value={form.hoaInfo ?? ''} onChange={e => set('hoaInfo', e.target.value)} />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Save listing'}
        </button>
      </form>

      {err && <p className="text-red-600 text-sm">{err}</p>}
    </div>
  );
}
