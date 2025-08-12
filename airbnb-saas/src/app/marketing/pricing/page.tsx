'use client';

import { useState } from 'react';

type Plan = 'starter' | 'premium' | 'coins';

async function startCheckout(plan: Plan) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json();
  if (data?.url) window.location.href = data.url;
  else alert(data?.error || 'Checkout failed');
}

function Card({
  title,
  price,
  subtitle,
  features,
  cta,
  onClick,
  highlight = false,
}: {
  title: string;
  price: string;
  subtitle?: string;
  features: string[];
  cta: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm flex flex-col gap-4 ${
        highlight ? 'border-indigo-500 shadow-md' : 'border-zinc-200'
      }`}
    >
      {highlight && (
        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
          Most Popular
        </div>
      )}
      <div className="text-xl font-semibold">{title}</div>
      <div className="text-3xl font-bold">{price}</div>
      {subtitle && <div className="text-sm text-zinc-500">{subtitle}</div>}
      <ul className="text-sm text-zinc-700 space-y-2 mt-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-zinc-400" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        className={`mt-4 rounded-xl px-4 py-2 font-medium ${
          highlight
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-zinc-900 text-white hover:bg-zinc-800'
        }`}
      >
        {cta}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const [loading, setLoading] = useState<Plan | null>(null);

  const go = async (p: Plan) => {
    if (loading) return;
    setLoading(p);
    try { await startCheckout(p); } finally { setLoading(null); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight">Simple pricing</h1>
      <p className="text-zinc-600 mt-2">
        Start with coins to try it, or unlock unlimited with Premium. Founder’s rate is limited.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-10">
        <Card
          title="Starter"
          price="$9.99 / mo"
          subtitle="For occasional users"
          features={[
            '20 credits per month',
            'Core templates',
            'Keep last 5 listings',
            'Email support',
          ]}
          cta={loading === 'starter' ? 'Redirecting…' : 'Choose Starter'}
          onClick={() => go('starter')}
        />

        <Card
          title="Premium"
          price="$24.99 / mo"
          subtitle="Founder’s Rate — Unlimited"
          features={[
            'Unlimited generates',
            'Pro templates & tones',
            'Full listing history',
            'Priority processing & support',
            'Free re-runs if unhappy',
          ]}
          cta={loading === 'premium' ? 'Redirecting…' : 'Go Premium'}
          onClick={() => go('premium')}
          highlight
        />

        <Card
          title="Coins"
          price="$10 / pack"
          subtitle="15 credits — pay as you go"
          features={[
            'Great for testing',
            'No subscription',
            'Upgrade anytime',
          ]}
          cta={loading === 'coins' ? 'Redirecting…' : 'Buy Coins'}
          onClick={() => go('coins')}
        />
      </div>

      <p className="text-xs text-zinc-500 mt-6">
        Cancel anytime. Starter refills 20 credits each billing cycle.
      </p>
    </div>
  );
}
