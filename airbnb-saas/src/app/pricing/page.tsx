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
        body: JSON.stringify({ planKey }), // send canonical key (e.g., 'Starter', 'Premium', 'CREDITS_15')
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DISPLAY_ORDER.map((key) => {
          const p = PLANS[key];
          const isPremiumUnlimited =
            p.mode === 'subscription' && !Number.isFinite(p.credits);
          const creditsLabel = isPremiumUnlimited
            ? 'Unlimited'
            : `${p.credits} credits`;

          const missingPrice = !p.priceId;

          return (
            <div key={key} className="rounded-2xl border p-5">
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="mt-1 text-zinc-500">{p.priceLabel}</div>

              <div className="mt-3 text-sm text-zinc-600">
                {p.mode === 'subscription'
                  ? `${creditsLabel} / month`
                  : `${creditsLabel} one-time`}
              </div>

              <button
                className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-60"
                onClick={() => startCheckout(key)}
                disabled={loadingKey === key || missingPrice}
                title={missingPrice ? 'Missing Stripe price id on server' : ''}
              >
                {missingPrice
                  ? 'Configure price first'
                  : loadingKey === key
                  ? 'Redirecting…'
                  : p.mode === 'subscription'
                  ? `Choose ${p.name}`
                  : `Buy ${p.name}`}
              </button>

              {missingPrice && (
                <p className="mt-2 text-xs text-red-600">
                  Missing env for this plan’s price id.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
