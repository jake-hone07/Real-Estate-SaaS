// src/lib/require-session.ts
import { redirect } from 'next/navigation';
import { createServer } from '@/lib/supabase/server';

export async function requireSession() {
  const supabase = await createServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // return the user and a ready-to-use supabase client
  return { user, supabase };
}
