'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession, useSessionContext } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';
import ListingForm from '@/components/ListingForm';
import toast from 'react-hot-toast';

type CreditResp = { balance: number } | { error: string };

export default function GeneratePage() {
  const session = useSession();
  const { isLoading } = useSessionContext();
  const router = useRouter();

  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cooldown UI
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);

  // Redirect only after auth has resolved
  useEffect(() => {
    if (!isLoading && !session) router.replace('/login');
  }, [isLoading, session, router]);

  const fetchCredits = async () => {
    setLoadingCredits(true);
    try {
      const res = await fetch('/api/credits', { cache: 'no-store' });
      const json = (await res.json()) as CreditResp;
      if (!res.ok || 'error' in json) throw new Error((json as any)?.error || `HTTP ${res.status}`);
      setCredits((json as any).balance ?? 0);
    } catch (e) {
      setCredits(null);
    } finally {
      setLoadingCredits(false);
    }
  };

  useEffect(() => {
    if (!isLoading && session?.user) fetchCredits();
  }, [isLoading, session]);

  // Keep chip fresh on tab focus
  useEffect(() => {
    const onFocus = () => fetchCredits();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Cooldown countdown tick
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const t = setInterval(() => setCooldownLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldownLeft]);

  const handleGenerate = async (formData: any) => {
    if (!session?.user) return router.replace('/login');

    // Guard: out of credits
    if ((credits ?? 0) <= 0) {
      toast.error('You are out of credits.');
      return;
    }
    // Guard: local cooldown
    if (cooldownLeft > 0) {
      toast('Please wait a moment before generating again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        cache: 'no-store',
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Handle specific cases nicely
        if (res.status === 402) {
          toast.error('Out of credits.');
          await fetchCredits();
          return;
        }
        if (res.status === 429) {
          // Expect error like: "Please wait Ns before generating again."
          const msg: string = json?.error || 'Please wait before generating again.';
          const seconds = extractSeconds(msg);
          if (seconds) setCooldownLeft(seconds);
          toast(msg);
          return;
        }
        toast.error(json?.error || 'Failed to generate.');
        return;
      }

      // Success: server already debited, returns cooldownSeconds too
      const cooldownSeconds: number | undefined = json?.cooldownSeconds;
      if (typeof cooldownSeconds === 'number' && cooldownSeconds > 0) {
        setCooldownLeft(cooldownSeconds);
      }

      await fetchCredits(); // refresh the chip
      toast.success('Listing generated! Check your dashboard to view/save it.');
    } catch (e: any) {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canGenerate = useMemo(() => {
    if (submitting) return false;
    if (cooldownLeft > 0) return false;
    return (credits ?? 0) > 0;
  }, [submitting, cooldownLeft, credits]);

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="animate-pulse text-sm text-gray-600">Loading…</div>
      </main>
    );
  }
  if (!session) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-4">
      <header className="mb-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Create a Listing</h1>
          <p className="text-sm text-gray-600">Facts-only generator — about 20–30 seconds.</p>
        </div>
        <div className="flex items-center gap-2">
          {cooldownLeft > 0 && (
            <span className="rounded-lg border px-2 py-1 text-xs bg-white shadow-sm">
              Cooldown: {cooldownLeft}s
            </span>
          )}
          <span className="rounded-xl border px-3 py-2 text-sm bg-white shadow-sm">
            Credits:{' '}
            {loadingCredits ? (
              <span className="text-gray-500">…</span>
            ) : credits === null ? (
              <span className="text-red-600">unavailable</span>
            ) : (
              <span className="font-semibold">{credits}</span>
            )}
          </span>
        </div>
      </header>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {/* ListingForm disables its own button if canGenerate is false via props */}
        <ListingForm
          onGenerate={handleGenerate}
          credits={credits}
          fetchCredits={fetchCredits}
          submitting={submitting || cooldownLeft > 0}
        />
        {!canGenerate && (credits ?? 0) > 0 && cooldownLeft > 0 && (
          <p className="mt-3 text-xs text-gray-600">
            Please wait for the cooldown to finish before generating again.
          </p>
        )}
      </div>
    </main>
  );
}

/** Extract a positive integer (seconds) from a message like "Please wait 7s ..." */
function extractSeconds(msg: string): number | null {
  const m = msg.match(/(\d+)\s*s/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}
