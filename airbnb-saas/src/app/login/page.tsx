'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const sp = useSearchParams();

  // sanitize redirect: paths only, no external URLs
  const rawRedirect = sp?.get('redirect') || '/';
  const redirectTo = useMemo(() => {
    try {
      if (/^([a-z]+:)?\/\//i.test(rawRedirect)) return '/';
      return rawRedirect.startsWith('/') ? rawRedirect : '/';
    } catch {
      return '/';
    }
  }, [rawRedirect]);

  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // If already logged in, bounce immediately
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      if (user) {
        window.location.href = redirectTo;
        return;
      }
      setChecking(false);
    })();
    return () => { alive = false; };
  }, [supabase, redirectTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErr(null);
    setLoading(true);
    try {
      const emailTrim = email.trim();

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: emailTrim, password: pw });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailTrim, password: pw });
        if (error) throw error;
      }

      // sync session into httpOnly cookies for middleware
      const { data: { session }, error: sessErr } = await supabase.auth.getSession();
      if (sessErr || !session) throw sessErr || new Error('No session after login');

      const resp = await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      });
      if (!resp.ok) {
        const { error } = await resp.json().catch(() => ({ error: 'Failed to set server session' }));
        throw new Error(error);
      }

      window.location.href = redirectTo; // hard redirect carries cookies
    } catch (e: any) {
      setErr(e?.message ?? 'Authentication failed');
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm opacity-70">
        Checking session…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-sm w-full p-6 bg-zinc-900 rounded-xl shadow-lg">
        <h1 className="text-xl font-bold mb-4 text-white">
          {mode === 'login' ? 'Log in' : 'Create your account'}
        </h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm text-zinc-300">Email</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1 w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none border border-zinc-700 focus:border-zinc-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-300">Password</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="********"
              minLength={6}
              className="mt-1 w-full px-3 py-2 rounded bg-zinc-800 text-white outline-none border border-zinc-700 focus:border-zinc-500"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded py-2"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        {err && <p className="text-red-400 mt-3">{err}</p>}

        <button
          className="text-blue-400 mt-4 underline"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        >
          {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
        </button>
      </div>
    </div>
  );
}
