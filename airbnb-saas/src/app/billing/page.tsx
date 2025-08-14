'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession, useSessionContext } from '@supabase/auth-helpers-react';
import toast from 'react-hot-toast';

type StatusResp =
  | { plan: string | null; status: string | null; current_period_end: string | null; balance: number }
  | { error: string };

export default function BillingPage() {
  const session = useSession();
  const { isLoading } = useSessionContext();
  const params = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  const success = params.get('success') === '1';
  const canceled = params.get('canceled') === '1';

  const loginHref = useMemo(() => {
    const current = `/billing${params.toString() ? `?${params.toString()}` : ''}`;
    return `/login?redirect=${encodeURIComponent(current)}`;
  }, [params]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/billing/status', { cache: 'no-store' });
      const j = (await r.json()) as StatusResp;
      if (!r.ok || 'error' in j) throw new Error((j as any)?.error || `HTTP ${r.status}`);
      setPlan(j.plan);
      setStatus(j.status);
      setPeriodEnd(j.current_period_end);
      setBalance(j.balance);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && session?.user) fetchStatus();
  }, [isLoading, session]);

  useEffect(() => {
    if (isLoading || !session) return;
    if (success) {
      toast.success('Payment successful! Credits update shortly if this was a top-up.');
      fetchStatus();
    } else if (canceled) {
      toast('Checkout canceled.');
    }
  }, [isLoading, session, success, canceled]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-sm text-gray-600">Loading…</div>
      </main>
    );
  }
  if (!session) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-3">Billing</h1>
        <p className="text-gray-600 mb-6">Please sign in to view your billing details.</p>
        <Link href={loginHref} className="inline-block rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <div className="rounded-xl border px-3 py-2 text-sm bg-white shadow-sm">
          Credits: <span className="font-semibold">{loading ? '…' : balance}</span>
        </div>
      </header>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-600">Current Plan</div>
            <div className="text-lg font-medium">
              {loading ? '…' : plan ? `${capitalize(plan)} (${status || '—'})` : 'None'}
            </div>
            {periodEnd && (
              <div className="text-xs text-gray-600">
                Renews: {new Date(periodEnd).toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/stripe/customer-portal" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
              Manage Billing
            </a>
            <a href="/api/checkout?sku=coins" className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
              Buy Top-Up (15 credits)
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Upgrade</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <PlanCard
            name="Starter"
            price="$9.99/mo"
            blurb="25 credits each month."
            href="/api/checkout?sku=starter"
          />
          <PlanCard
            name="Premium"
            price="$29.99/mo"
            blurb="Unlimited* with fair-use limits."
            href="/api/checkout?sku=premium"
          />
          <PlanCard
            name="Top-Up (15 credits)"
            price="$10 one-time"
            blurb="One-time credit pack."
            href="/api/checkout?sku=coins"
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          *Unlimited within fair-use limits. Heavy usage may be throttled.
        </p>
      </section>
    </main>
  );
}

function PlanCard({ name, price, blurb, href }: { name: string; price: string; blurb: string; href: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-lg font-semibold">{name}</div>
      <div className="text-sm text-gray-600">{price}</div>
      <p className="mt-2 text-sm text-gray-600">{blurb}</p>
      <a href={href} className="mt-3 inline-block w-full rounded-lg border px-3 py-2 text-center text-sm hover:bg-gray-50">
        Buy {name.split(' ')[0]}
      </a>
    </div>
  );
}

function capitalize(s: string) {
  return s.slice(0, 1).toUpperCase() + s.slice(1);
}
