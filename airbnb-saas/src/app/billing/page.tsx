// app/billing/page.tsx
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

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

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Billing</h1>

      <section className="mt-6 rounded-2xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Current Plan</div>
            <div className="mt-1 text-lg font-medium">{plan}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Credits</div>
            <div className="mt-1 text-lg font-semibold">{credits}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/api/billing/portal"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Manage Billing
          </a>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Upgrade</h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose a plan to add credits or start a subscription.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <PlanCard
            name="Starter"
            price="$9"
            desc="One-time credits for small projects."
            planKey="Starter"
          />
          <PlanCard
            name="Premium"
            price="$29/mo"
            desc="Monthly credits for consistent usage."
            planKey="Premium"
          />
        </div>
      </section>
    </main>
  );
}

function PlanCard({
  name,
  price,
  desc,
  planKey,
}: {
  name: string;
  price: string;
  desc: string;
  planKey: string;
}) {
  return (
    <div className="rounded-2xl border p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">{name}</h3>
        <div className="text-lg font-medium">{price}</div>
      </div>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>

      {/* Direct link to Stripe via checkout GET handler */}
      <a
        href={`/api/checkout?planKey=${encodeURIComponent(planKey)}`}
        className="mt-4 inline-block w-full rounded-lg bg-black px-4 py-2 text-center text-sm font-medium text-white hover:opacity-90"
      >
        Buy {planKey}
      </a>
    </div>
  );
}
