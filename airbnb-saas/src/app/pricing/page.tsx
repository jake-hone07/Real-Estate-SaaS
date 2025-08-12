// src/app/pricing/page.tsx
'use client';

import { useState } from 'react';
import { PLANS, DISPLAY_ORDER } from '@/lib/billing';

export default function PricingPage() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function startCheckout(planKey: string) {
    try {
      setLoadingKey(planKey);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey }), // send canonical key
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (err: any) {
      alert(err?.message || 'Checkout failed');
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Pricing</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DISPLAY_ORDER.map((key) => {
          const p = PLANS[key];
          return (
            <div key={key} className="rounded-2xl border p-5">
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="mt-1 text-zinc-500">{p.priceLabel}</div>
              <div className="mt-3 text-sm text-zinc-600">
                {p.mode === 'subscription'
                  ? `${p.credits} credits / month`
                  : `${p.credits} credits one-time`}
              </div>

              <button
                className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-60"
                onClick={() => startCheckout(key)}
                disabled={loadingKey === key}
              >
                {loadingKey === key
                  ? 'Redirecting…'
                  : p.mode === 'subscription'
                  ? `Choose ${p.name}`
                  : `Buy ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
