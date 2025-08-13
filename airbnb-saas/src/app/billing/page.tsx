// app/billing/page.tsx
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { listPlans } from '@/lib/billing';

export const dynamic = 'force-dynamic';

type ProfileRow = { plan_key: string | null };
type BalanceRow = { balance: number | null };

export default async function BillingPage() {
  const supabase = createServerComponentClient<any>({ cookies });

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="mt-4">Please sign in to view your billing details.</p>
      </main>
    );
  }

  // Profile (plan)
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_key')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

  // Credits
  const { data: bal } = await supabase
    .from('credits_balance')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle<BalanceRow>();

  const plan = profile?.plan_key ?? 'None';
  const credits = bal?.balance ?? 0;

  const plans = listPlans();

  // Render
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Billing</h1>

      <section className="mt-6 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Current Plan</div>
            <div className="mt-1 text-lg font-medium">
              {plan === 'Premium' ? 'Premium (Unlimited, fair use)' : plan}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Credits</div>
            <div className="mt-1 text-lg font-semibold">
              {plan === 'Premium' ? 'Unlimited' : credits}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/api/billing/portal"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Manage Billing
          </a>
          {/* Always show top-up option */}
          <a
            href="/api/checkout?planKey=Coins"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Buy Top-Up (15 credits)
          </a>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Upgrade</h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose a plan to add monthly credits or go unlimited. Use Top-Up anytime if you run out.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {plans.map((p) => {
            const isCoins = p.key === 'Coins';
            return (
              <div key={p.key} className="rounded-2xl border p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  <div className="text-lg font-medium">{p.priceLabel}</div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {isCoins
                    ? 'One-time top-up of 15 credits.'
                    : p.key === 'Premium'
                    ? 'Unlimited usage with fair-use limits.'
                    : `Subscription: ${p.credits} credits per month.`}
                </p>
                <a
                  href={`/api/checkout?planKey=${encodeURIComponent(p.key)}`}
                  className="mt-4 inline-block w-full rounded-lg bg-black px-4 py-2 text-center text-sm font-medium text-white hover:opacity-90"
                >
                  {isCoins ? 'Buy Top-Up' : `Buy ${p.name}`}
                </a>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
