"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const redirectTo = sp.get("redirect") || "/my-listings";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, bounce away immediately
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted && user) router.replace(redirectTo);
    })();

    // Also listen for auth changes (covers OAuth + password)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) router.replace(redirectTo);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [redirectTo, router]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange will navigate; this is a fallback:
      router.replace(redirectTo);
    } catch (err: any) {
      setError(err.message ?? "Auth error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      router.replace(redirectTo);
    } catch (err: any) {
      setError(err.message ?? "Sign up error");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + redirectTo },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-gray-400">Sign in to manage your listings.</p>
      </header>

      <button
        onClick={signInWithGoogle}
        className="w-full rounded-lg border px-3 py-2"
      >
        Continue with Google
      </button>

      <div className="text-center text-sm text-gray-500">or</div>

      <form className="space-y-3" onSubmit={handleEmailAuth}>
        <input
          className="w-full rounded-lg border bg-transparent p-2"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border bg-transparent p-2"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div className="rounded bg-red-50 p-2 text-red-700">{error}</div>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="w-1/2 rounded-lg bg-white px-3 py-2 text-black"
          >
            {loading ? "Working..." : "Sign in"}
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-1/2 rounded-lg border px-3 py-2"
          >
            Create account
          </button>
        </div>
      </form>
    </main>
  );
}
