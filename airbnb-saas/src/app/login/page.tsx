"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const redirectTo = sp?.get("redirect") ?? "/";

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) router.replace(redirectTo);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }
    router.replace(redirectTo);
  }

  async function onSendMagic() {
    if (!email) return setMsg("Enter your email first.");
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });
    if (error) setMsg(error.message);
    else setMsg(`Check your inbox — we sent a sign-in link to ${email}.`);
    setBusy(false);
  }

  return (
    <main className="mx-auto grid min-h-[70vh] place-items-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-gray-800 bg-black/40 p-5">
        <h1 className="mb-4 text-lg font-semibold">Log in</h1>

        {msg && (
          <div className="mb-3 rounded border border-amber-700/40 bg-amber-900/20 p-2 text-sm text-amber-300">
            {msg}
          </div>
        )}

        <form onSubmit={onLogin} className="space-y-3">
          <label className="block text-sm">
            <span className="text-gray-300">Email</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-700 bg-transparent p-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-300">Password</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-700 bg-transparent p-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button
            disabled={busy}
            className="w-full rounded-xl bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Log in"}
          </button>
        </form>

        <div className="mt-4 space-y-2">
          <button
            disabled={busy}
            onClick={onSendMagic}
            className="w-full rounded-xl border border-gray-700 px-3 py-2 text-sm hover:bg-gray-900 disabled:opacity-60"
          >
            Send magic link
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          Don’t have an account?{" "}
          <a href="/signup" className="underline">Sign up</a>
        </p>
      </div>
    </main>
  );
}
