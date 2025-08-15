import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/require-session';

export default async function AppIndex() {
  await requireSession();        // keep /app protected
  redirect('/generate');         // <-- change to your real path if different
}
