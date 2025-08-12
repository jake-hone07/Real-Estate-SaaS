'use client';

import { useEffect, useState } from 'react';

type Row = {
  id: string;
  title: string | null;
  template: string | null;
  description?: string;
  output?: string; // fallback if your API still returns this
  created_at: string;
};

export default function ListingsPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/listings?offset=${page * pageSize}&limit=${pageSize}`);
        const json = await res.json();
        setItems(Array.isArray(json?.data) ? json.data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">My Listings</h1>

      <div className="mt-6 grid gap-4">
        {loading && <div className="text-zinc-500">Loading…</div>}
        {!loading && items.length === 0 && (
          <div className="text-zinc-500">No listings yet.</div>
        )}
        {items.map((l) => (
          <ListingRow key={l.id} row={l} />
        ))}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Prev
        </button>
        <button
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border px-3 py-1.5 text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ListingRow({ row }: { row: Row }) {
  const text = (row.description ?? row.output ?? '').toString();

  return (
    <div className="rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <div className="font-medium">{row.title || 'Untitled listing'}</div>
        <div className="text-xs text-zinc-500">
          {new Date(row.created_at).toLocaleString()}
        </div>
      </div>
      <div className="text-xs uppercase tracking-wide text-zinc-500 mt-1">
        {row.template || 'default'}
      </div>
      <pre className="mt-3 text-sm whitespace-pre-wrap">{text}</pre>
      <div className="flex gap-3 mt-3">
        <button
          onClick={() => navigator.clipboard.writeText(text)}
          className="rounded-lg bg-zinc-900 text-white px-3 py-1.5 text-sm"
        >
          Copy
        </button>
        <a
          href={`/generate?regenerate=${row.id}`}
          className="rounded-lg border px-3 py-1.5 text-sm"
        >
          Re-generate
        </a>
        <DownloadBtn name={`${row.title || 'listing'}.txt`} text={text} />
      </div>
    </div>
  );
}

function DownloadBtn({ name, text }: { name: string; text: string }) {
  const onDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <button onClick={onDownload} className="rounded-lg border px-3 py-1.5 text-sm">
      Download
    </button>
  );
}
