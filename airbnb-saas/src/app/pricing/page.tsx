// app/pricing/page.tsx
import { listPlans } from '@/lib/billing';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const plans = listPlans(); // always returns an array (possibly empty)

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-semibold">Pricing</h1>
      <p className="mt-2 text-gray-600">
        Choose a plan to purchase credits or start a subscription. You&apos;ll be redirected
        to Stripe Checkout to complete your purchase.
      </p>

      {plans.length === 0 ? (
        <div className="mt-8 rounded-xl border p-6">
          <p>No plans are currently available. Please check back later.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {plans.map((p) => (
            <div key={p.key} className="rounded-xl border p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-semibold">{p.name}</h2>
                <span className="text-lg font-medium">{p.priceLabel}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {p.mode === 'payment'
                  ? `One-time ${p.credits} credits.`
                  : `Subscription: ${p.credits} credits per billing cycle.`}
              </p>
              <a
                href={`/api/checkout?planKey=${encodeURIComponent(p.key)}`}
                className="mt-4 inline-block w-full rounded-lg bg-black px-4 py-2 text-center text-sm font-medium text-white hover:opacity-90"
              >
                Buy {p.name}
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
