"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams(); // now safely inside Suspense

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Where to go after login
  const redirectTo = useMemo(() => sp.get("redirect") || "/generate", [sp]);

  // If already logged in, just go to redirect
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace(redirectTo);
        return;
      }
      setChecking(false);
    })();
  }, [redirectTo, router]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(
            redirectTo
          )}`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to send link. Try again.");
    }
  }

  async function signInWithGoogle() {
    setError(null);
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(
          redirectTo
        )}`,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) setError(error.message);
  }

  if (checking) return <LoginSkeleton />;

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-1 text-sm text-gray-400">
        We’ll email you a magic link. You can also continue with Google.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-rose-700/40 bg-rose-900/20 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {sent ? (
        <div className="mt-6 rounded-lg border border-emerald-700/40 bg-emerald-900/20 p-4 text-emerald-300">
          Check your inbox — we’ve sent a sign-in link to <b>{email}</b>.
        </div>
      ) : (
        <form onSubmit={sendMagicLink} className="mt-6 space-y-3">
          <label className="block text-sm text-gray-300">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-gray-500"
              placeholder="you@example.com"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm hover:bg-white/5"
          >
            Send magic link
          </button>

          <div className="relative py-1 text-center text-xs text-gray-500">
            <span className="bg-black px-2">or</span>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm hover:bg-white/5"
          >
            Continue with Google
          </button>
        </form>
      )}
    </main>
  );
}

function LoginSkeleton() {
  return (
    <main className="mx-auto max-w-md p-6">
      <div className="animate-pulse space-y-3">
        <div className="h-7 w-40 rounded bg-gray-800/40" />
        <div className="h-16 rounded bg-gray-800/40" />
        <div className="h-10 rounded bg-gray-800/40" />
        <div className="h-10 rounded bg-gray-800/40" />
      </div>
    </main>
  );
}
