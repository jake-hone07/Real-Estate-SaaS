'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, useSessionContext } from '@supabase/auth-helpers-react';

export default function AppHeader() {
  const session = useSession();
  const { isLoading, supabaseClient } = useSessionContext();
  const router = useRouter();
  const params = useSearchParams();

  const onLogout = async () => {
    try {
      await supabaseClient.auth.signOut();
      // Optional: keep redirect param support
      const redirect = params.get('redirect');
      router.replace(redirect || '/');
    } catch {
      router.replace('/');
    }
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">🏠 YourBrand</Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="hover:underline">Pricing</Link>
          <Link href="/generate" className="hover:underline">Generate</Link>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/billing" className="hover:underline">Billing</Link>

          {/* Auth actions (wait for session to resolve to avoid flicker) */}
          {isLoading ? (
            <span className="text-zinc-500">…</span>
          ) : session ? (
            <button
              onClick={onLogout}
              className="rounded-lg border px-3 py-1.5 hover:bg-zinc-50"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border px-3 py-1.5 hover:bg-zinc-50"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
