'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Listing = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  address?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  price?: number | null;
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [title, setTitle] = useState(listing.title ?? '');
  const [description, setDescription] = useState(listing.description ?? '');
  const [busy, setBusy] = useState<'save' | 'delete' | null>(null);
  const id = String(listing.id);

  async function save() {
    setBusy('save');
    try {
      const r = await fetch(`/api/listings/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        throw new Error(b?.error || 'Failed to save');
      }
      router.refresh();
    } catch (e: any) {
      console.error(e);
      alert('Save failed');
    } finally {
      setBusy(null);
    }
  }

  async function del() {
    if (!confirm('Delete this listing?')) return;
    setBusy('delete');
    try {
      const r = await fetch(`/api/listings/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!r.ok) {
        const b = await r.json().catch(() => ({}));
        throw new Error(b?.error || 'Failed to delete');
      }
      router.refresh();
    } catch (e: any) {
      console.error(e);
      alert('Delete failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="border rounded p-4 space-y-3 hover:ring-1 ring-white/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{listing.title || 'Untitled Listing'}</div>
          {listing.address && <div className="text-sm opacity-70">{listing.address}</div>}
          <div className="text-[11px] opacity-50 mt-1">ID: {id}</div>
        </div>
        <a href={`/listing/${encodeURIComponent(id)}`} className="text-sm underline">View</a>
      </div>

      <div className="text-sm">
        {(listing.bedrooms ?? '-') + ' bd'} • {(listing.bathrooms ?? '-') + ' ba'} • {(listing.squareFeet ?? '-') + ' sqft'}
      </div>
      {typeof listing.price === 'number' && (
        <div className="font-semibold">${listing.price.toLocaleString()}</div>
      )}

      <div className="space-y-2">
        <input
          className="w-full border p-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <textarea
          className="w-full border p-2 rounded"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
        />
        <div className="flex gap-2">
          <button className="border px-3 py-2 rounded" onClick={save} disabled={busy !== null}>
            {busy === 'save' ? 'Saving…' : 'Save'}
          </button>
          <button className="border px-3 py-2 rounded" onClick={del} disabled={busy !== null}>
            {busy === 'delete' ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </li>
  );
}
