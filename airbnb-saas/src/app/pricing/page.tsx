'use client';

export default function PricingPage() {
  async function checkout(priceId: string, mode: 'payment'|'subscription') {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId, mode, successPath: '/dashboard?purchase=success' }),
    });
    const { url, error } = await res.json();
    if (url) window.location.href = url;
    else alert(error || 'Checkout failed');
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-center">Pricing</h1>
      <p className="mt-2 text-center text-zinc-600">Start free. Upgrade when you’re ready.</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {/* Free */}
        <Card title="Free" price="$0" blurb="Kick the tires. Limited credits.">
          <ul className="text-sm text-zinc-600 space-y-1">
            <li>• Basic generator</li>
            <li>• Community support</li>
          </ul>
          <a href="/generate" className="mt-4 inline-block rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50">
            Try it now
          </a>
        </Card>

        {/* Starter */}
        <Card title="Starter" price="$9.99/mo" blurb="For occasional listings.">
          <ul className="text-sm text-zinc-600 space-y-1">
            <li>• 20 credits / month</li>
            <li>• Email support</li>
          </ul>
          <button
            onClick={() => checkout(process.env.NEXT_PUBLIC_STARTER_PRICE_ID!, 'subscription')}
            className="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
          >
            Get Starter
          </button>
        </Card>

        {/* Premium */}
        <Card highlight title="Premium" price="$29.99/mo" blurb="Unlimited + Pro templates.">
          <ul className="text-sm text-zinc-600 space-y-1">
            <li>• Unlimited generates</li>
            <li>• Luxury template (Pro)</li>
            <li>• Priority speed & support</li>
          </ul>
          <button
            onClick={() => checkout(process.env.NEXT_PUBLIC_PREMIUM_PRICE_ID!, 'subscription')}
            className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
          >
            Go Premium
          </button>
        </Card>
      </div>

      {/* Coins */}
      <div className="mt-10 rounded-2xl border p-6">
        <h2 className="text-lg font-semibold">Need more credits?</h2>
        <p className="text-sm text-zinc-600 mt-1">Buy a one-time pack of 15 credits.</p>
        <button
          onClick={() => checkout(process.env.NEXT_PUBLIC_COINS_PRICE_ID!, 'payment')}
          className="mt-4 rounded-xl border px-4 py-2 text-sm hover:bg-zinc-50"
        >
          Buy 15 credits
        </button>
      </div>
    </div>
  );
}

function Card({
  title, price, blurb, children, highlight,
}: {
  title: string; price: string; blurb: string; children: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-6 ${highlight ? 'border-indigo-300 bg-indigo-50' : ''}`}>
      <div className="text-zinc-900 text-lg font-semibold">{title}</div>
      <div className="mt-1 text-2xl font-bold">{price}</div>
      <p className="mt-1 text-sm text-zinc-600">{blurb}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
