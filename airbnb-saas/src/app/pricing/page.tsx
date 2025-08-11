'use client';

import { PLANS } from '@/lib/billing';
import { useState } from 'react';

async function checkout(planKey: keyof typeof PLANS) {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planKey }),
  });
  const data = await res.json();
  if (data?.url) window.location.href = data.url;
}

async function openPortal() {
  const res = await fetch('/api/stripe/portal', { method: 'POST' });
  const data = await res.json();
  if (data?.url) window.location.href = data.url;
}

export default function PricingPage() {
  const [loadingKey, setLoadingKey] = useState<null | string>(null);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-center mb-2">Pricing</h1>
      <p className="text-center text-gray-600 mb-8">Buy credits, generate listings. Cancel anytime.</p>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {Object.entries(PLANS).map(([key, p]) => (
          <div key={key} className="bg-white rounded-xl shadow p-6 border">
            <h3 className="text-xl font-semibold mb-1">{p.name}</h3>
            <div className="text-2xl font-bold mb-2">{p.priceLabel}</div>
            <p className="text-gray-600 mb-6">{p.credits} credits / month</p>
            <button
              onClick={async () => {
                setLoadingKey(key);
                await checkout(key as keyof typeof PLANS);
                setLoadingKey(null);
              }}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              disabled={loadingKey === key}
            >
              {loadingKey === key ? 'Redirecting…' : 'Choose plan'}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <button onClick={openPortal} className="text-sm text-blue-600 underline">
          Manage subscription
        </button>
      </div>
    </main>
  );
}
