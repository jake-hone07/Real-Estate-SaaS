// /lib/require-session.ts
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase-server';

export async function requireSession() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await (await supabase).auth.getUser();
  if (!user) redirect('/login');
  return { user, supabase };
}
