"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

/** Page wrapper provides the Suspense boundary required by useSearchParams */
export default function BillingPage() {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <BillingInner />
    </Suspense>
  );
}

type BusyKey = null | "credits" | "subscription" | "portal";

function BillingInner() {
  const router = useRouter();
  const sp = useSearchParams(); // now safely inside Suspense

  const [email, setEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [busy, setBusy] = useState<BusyKey>(null);
  const [error, setError] = useState<string | null>(null);

  const success = sp.get("success") === "1";
  const canceled = sp.get("canceled") === "1";

  /** ---- Auth gate (client) ---- */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?redirect=/billing");
        return;
      }
      setEmail(user.email ?? null);
      setAuthChecked(true);
    })();
  }, [router]);

  /** ---- Safe JSON POST (falls back if HTML error appears) ---- */
  async function postJSONSafe(url: string, body: any) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const raw = await r.text();
    let json: any;
    try { json = JSON.parse(raw); } catch { json = { error: raw?.slice(0, 200) || "Unexpected response" }; }

    return { ok: r.ok, json };
  }

  async function startCheckout(mode: "credits" | "subscription") {
    if (!email) return;
    setBusy(mode);
    setError(null);
    const { ok, json } = await postJSONSafe("/api/stripe/checkout", { email, mode });
    if (!ok || !json?.url) {
      setBusy(null);
      setError(json?.error || "Could not start checkout. Please try again.");
      return;
    }
    window.location.href = json.url as string;
  }

  async function openPortal() {
    if (!email) return;
    setBusy("portal");
    setError(null);
    const { ok, json } = await postJSONSafe("/api/stripe/portal", { email });
    if (!ok || !json?.url) {
      setBusy(null);
      setError(json?.error || "Could not open customer portal.");
      return;
    }
    window.location.href = json.url as string;
  }

  const disabled = useMemo(() => !email || !!busy, [email, busy]);

  if (!authChecked) return <BillingSkeleton />;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-gray-400">
          Buy a credits pack or start a subscription. You can manage your payment details in the
          Stripe customer portal at any time.
        </p>
      </header>

      {success && <Alert tone="success" title="Payment successful">Thanks! Stripe emailed your receipt.</Alert>}
      {canceled && <Alert tone="warn" title="Checkout canceled">No charges were made.</Alert>}
      {error && <Alert tone="error" title="Something went wrong">{error}</Alert>}

      <section className="rounded-2xl border border-gray-800 p-5">
        <h2 className="text-lg font-medium">Your account</h2>
        <div className="mt-2 text-sm text-gray-300">Email: {email ?? "—"}</div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <PricingCard
          title="Credits pack"
          description="One-time purchase. Great when you only need a handful of generations."
          primaryCtaLabel={busy === "credits" ? "Redirecting…" : "Buy credits"}
          onPrimaryCta={() => startCheckout("credits")}
          disabled={disabled}
          badge="One-time"
          bullets={["Pay once, use anytime", "No renewal or commitment", "Good for occasional users"]}
        />
        <PricingCard
          title="Subscription"
          description="Monthly plan with generous limits and priority generation."
          primaryCtaLabel={busy === "subscription" ? "Redirecting…" : "Start subscription"}
          onPrimaryCta={() => startCheckout("subscription")}
          disabled={disabled}
          badge="Monthly"
          bullets={["Predictable monthly cost", "Cancel anytime in the portal", "Best for frequent users"]}
          highlight
        />
      </section>

      <section className="rounded-2xl border border-gray-800 p-5">
        <h3 className="text-lg font-medium">Manage billing</h3>
        <p className="mt-1 text-sm text-gray-400">
          Update payment method, download invoices, or cancel/resume a subscription.
        </p>
        <button
          disabled={disabled}
          onClick={openPortal}
          className="mt-4 rounded-xl border border-gray-700 px-3 py-2 text-sm hover:bg-gray-900 disabled:opacity-60"
        >
          {busy === "portal" ? "Opening…" : "Open customer portal"}
        </button>
      </section>

      <section className="rounded-2xl border border-gray-800 p-5">
        <h3 className="text-lg font-medium">FAQ</h3>
        <ul className="mt-3 space-y-3 text-sm text-gray-300">
          <li><b>Do I need an account to pay?</b> — Yes. We link your payment to your account email.</li>
          <li><b>Can I get a refund?</b> — Contact support; we handle reasonable requests.</li>
          <li><b>How do I cancel?</b> — Open the customer portal above and cancel anytime.</li>
        </ul>
      </section>
    </main>
  );
}

/* ---- Loading skeleton used for Suspense fallback and auth-check ---- */
function BillingSkeleton() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-7 w-48 rounded bg-gray-800/40" />
        <div className="h-32 rounded bg-gray-800/40" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-44 rounded bg-gray-800/40" />
          <div className="h-44 rounded bg-gray-800/40" />
        </div>
      </div>
    </main>
  );
}

/* ---- Small UI bits ---- */
function Alert({
  tone, title, children,
}: { tone: "success" | "warn" | "error"; title: string; children: React.ReactNode }) {
  const palette =
    tone === "success"
      ? "border-emerald-700/40 bg-emerald-900/20 text-emerald-300"
      : tone === "warn"
      ? "border-amber-700/40 bg-amber-900/20 text-amber-300"
      : "border-rose-700/40 bg-rose-900/20 text-rose-300";
  return (
    <div className={`rounded-lg border p-3 ${palette}`}>
      <div className="font-medium">{title}</div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

function PricingCard({
  title, description, bullets, primaryCtaLabel, onPrimaryCta, disabled, badge, highlight,
}: {
  title: string;
  description: string;
  bullets: string[];
  primaryCtaLabel: string;
  onPrimaryCta: () => void;
  disabled?: boolean;
  badge?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl border p-5 ${highlight ? "border-gray-700 bg-white/5" : "border-gray-800"}`}>
      {badge && (
        <span className="absolute right-4 top-4 rounded-full border border-gray-700 px-2 py-0.5 text-xs text-gray-300">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">{description}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-300">
        {bullets.map((b) => <li key={b}>{b}</li>)}
      </ul>
      <button
        disabled={disabled}
        onClick={onPrimaryCta}
        className={`mt-4 w-full rounded-xl px-3 py-2 text-sm font-medium ${
          highlight ? "bg-white text-black" : "border border-gray-700 hover:bg-gray-900 text-gray-100"
        } disabled:opacity-60`}
      >
        {primaryCtaLabel}
      </button>
    </div>
  );
}
