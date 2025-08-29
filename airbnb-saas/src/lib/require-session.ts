// src/lib/require-session.ts
import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

type RequireSessionResult = {
  user: User;
  supabase: Awaited<ReturnType<typeof createClientServer>>;
};

export async function requireSession(): Promise<RequireSessionResult> {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return { user, supabase };
}
