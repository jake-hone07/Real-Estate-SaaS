'use client';

import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) router.replace('/app'); }, [user, router]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setLoading(false);
    if (error) alert(error.message);
    else router.replace('/app');
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password: pwd });
    setLoading(false);
    if (error) alert(error.message);
    else alert('Check your email to confirm your account.');
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form className="space-y-3" onSubmit={signIn}>
        <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} />
        <button className="w-full border p-2 rounded" disabled={loading}>{loading? '...' : 'Sign in'}</button>
      </form>
      <button className="mt-3 text-sm underline" onClick={signUp}>Create account</button>
    </main>
  );
}
