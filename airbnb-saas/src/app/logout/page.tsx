'use client';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function Logout() {
  const supabase = useSupabaseClient();
  const router = useRouter();
  return (
    <main className="p-6">
      <button
        className="border px-3 py-2 rounded"
        onClick={async ()=>{ await supabase.auth.signOut(); router.replace('/login'); }}
      >
        Sign out
      </button>
    </main>
  );
}
