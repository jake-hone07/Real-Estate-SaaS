'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState<'idle' | 'signin' | 'signup'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // If already authed, bounce to app
  useEffect(() => {
    if (user) router.replace('/app');
  }, [user, router]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading('signin');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading('idle');
    if (error) setErr(error.message);
    else router.replace('/app');
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setLoading('signup');
    const { error } = await supabase.auth.signUp({
      email,
      password: pwd,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/app` : undefined,
      },
    });
    setLoading('idle');
    if (error) setErr(error.message);
    else setMsg('Check your email to confirm your account. After confirming, you can sign in.');
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>

      <form className="space-y-3" onSubmit={signIn}>
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          required
          minLength={6}
        />
        <button
          className="w-full p-2 rounded bg-black text-white disabled:opacity-60"
          disabled={loading !== 'idle'}
          type="submit"
        >
          {loading === 'signin' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <button
        className="mt-3 text-sm underline"
        onClick={signUp}
        disabled={loading !== 'idle'}
      >
        {loading === 'signup' ? 'Creating…' : 'Create account'}
      </button>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
      {msg && <p className="mt-3 text-sm text-green-700">{msg}</p>}
    </main>
  );
}
