'use client';

import { useEffect, useMemo, useState } from 'react';

type Plan = 'free' | 'starter' | 'premium';
type Profile = { plan: Plan; credits: number | null } | null;
type Listing = {
  id: string;
  title: string | null;
  template: string | null;
  description?: string; // preferred
  output?: string;      // fallback
  created_at: string;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile>(null);
  const [recent, setRecent] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [pRes, lRes] = await Promise.all([
          fetch('/api/me/profile'),
          fetch('/api/listings?limit=5'),
        ]);

        // Profile
        if (pRes.ok) {
          const p = await pRes.json();
          if (alive) setProfile(p?.data ?? null);
        } else {
          setErr('Could not load profile');
        }

        // Recent
        if (lRes.ok) {
          const l = await lRes.json();
          if (alive) setRecent(Array.isArray(l?.data) ? l.data : []);
        } else {
          setErr((e) => e ?? 'Could not load listings');
        }
      } catch {
        setErr('Network error. Please refresh.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const badgeText = useMemo(() => {
    if (!profile) return '—';
    if (profile.plan === 'premium') return 'Unlimited';
    const c = profile.credits ?? 0;
    return profile.plan === 'starter' ? `${c} credits` : `${c} credits (Free)`;
  }, [profile]);

  async function openBillingPortal() {
    try {
      setPortalLoading(true);
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else alert(data?.error || 'Could not open billing portal');
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Top header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-zinc-500">Turn property facts into market-ready listings.</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`text-sm px-3 py-1 rounded-full border ${
              profile?.plan === 'premium'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-zinc-300 text-zinc-700'
            }`}
          >
            {loading ? '—' : badgeText}
          </span>
          <a
            href="/generate"
            className="rounded-xl bg-zinc-900 text-white px-4 py-2 hover:bg-zinc-800"
          >
            New Listing
          </a>
          <button
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="rounded-xl border px-4 py-2 hover:bg-zinc-50 disabled:opacity-60"
          >
            {portalLoading ? 'Opening…' : 'Manage Billing'}
          </button>
        </div>
      </div>

      {/* Upgrade banner (only for non-premium) */}
      {profile && profile.plan !== 'premium' && (
        <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-indigo-900">
              <strong>Unlock Premium:</strong> Unlimited generates, Pro templates (Luxury), full history, and priority support.
            </div>
            <a
              href="/pricing"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Upgrade for Unlimited
            </a>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Plan"
          value={
            loading ? '—' : profile?.plan === 'premium'
              ? 'Premium'
              : profile?.plan === 'starter'
              ? 'Starter'
              : 'Free'
          }
        />
        <Stat label="Credits" value={loading ? '—' : badgeText} />
        <Stat label="Recent listings" value={loading ? '—' : String(recent.length)} />
      </div>

      {/* Recent listings */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent listings</h2>
          <a href="/listings" className="text-sm text-indigo-600 hover:underline">
            View all
          </a>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error */}
        {!loading && err && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {err}
          </div>
        )}

        {/* Empty state */}
        {!loading && !err && recent.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed p-8 text-center">
            <div className="text-lg font-medium">No listings yet</div>
            <p className="mt-1 text-sm text-zinc-500">
              Create your first listing in under a minute.
            </p>
            <a
              href="/generate"
              className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Create a Listing
            </a>
          </div>
        )}

        {/* Cards */}
        {!loading && !err && recent.length > 0 && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {recent.map((item) => (
              <ListingCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------------- components ---------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-zinc-200" />
        <div className="h-3 w-28 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-zinc-200" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-zinc-200" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-200" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="mt-4 flex gap-3">
        <div className="h-8 w-16 animate-pulse rounded bg-zinc-200" />
        <div className="h-8 w-24 animate-pulse rounded bg-zinc-200" />
      </div>
    </div>
  );
}

function ListingCard({ item }: { item: Listing }) {
  const text = (item.description ?? item.output ?? '').toString();

  const onCopy = async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
  };

  const onDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title || 'listing'}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <div className="font-medium">{item.title || 'Untitled listing'}</div>
        <span className="text-xs text-zinc-500">
          {new Date(item.created_at).toLocaleString()}
        </span>
      </div>
      
      <div className="line-clamp-4 text-sm text-zinc-700 whitespace-pre-wrap">{text}</div>

      <div className="mt-auto flex flex-wrap gap-3 pt-2">
        <button
          onClick={onCopy}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
        >
          Copy
        </button>
        <button
          onClick={onDownload}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Download
        </button>
        <a
          href={`/generate?regenerate=${item.id}`}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50"
        >
          Re-generate
        </a>
      </div>
    </div>
  );
}
