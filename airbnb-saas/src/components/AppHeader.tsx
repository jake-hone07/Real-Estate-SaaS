'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

const link = (active: boolean) =>
  `px-2 py-1 ${active ? 'underline' : 'opacity-90 hover:underline'}`;

export default function AppHeader() {
  const pathname = usePathname();
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/10">
      <Link href="/" className="font-semibold">ListingForge</Link>

      <nav className="flex items-center gap-4">
        <Link href="/generate" className={link(pathname.startsWith('/generate'))}>Generate</Link>
        <Link href="/my-listings" className={link(pathname === '/my-listings')}>My Listings</Link>
        <Link href="/billing" className={link(pathname === '/billing')}>Billing</Link>
      </nav>

      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded bg-white/10">Plan: free</span>
        <span className="text-xs px-2 py-1 rounded bg-white/10">Credits: 8</span>
        {!user ? (
          <Link href="/login" className="underline">Login</Link>
        ) : (
          <button onClick={logout} className="underline">Logout</button>
        )}
      </div>
    </header>
  );
}
