import { redirect } from 'next/navigation';
import { createClientServer } from '@/lib/supabase';
import ListingClient from './ListingClient';

export default async function ListingCreatePage() {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <ListingClient />;
}
