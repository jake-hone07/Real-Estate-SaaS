'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export type ListingPayload = {
  title: string;                    // e.g., "Mountain View Condo with Balcony"
  description?: string | null;      // plain text long form (fallback if you want)
  price?: number | null;            // optional
  content: any;                     // the full structured JSON you show in preview
};

export default function SaveListingButton({
  getPayload,
  className,
  children = 'Save to My Listings',
}: {
  getPayload: () => ListingPayload | null | undefined;
  className?: string;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onClick() {
    if (busy) return;
    const payload = getPayload?.();
    if (!payload) return;

    setBusy(true);
    try {
      // ensure user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login?redirect=/generate';
        return;
      }

      const { error } = await supabase.from('listings').insert([{
        user_id: user.id,
        title: payload.title,
        description: payload.description ?? null,
        price: payload.price ?? null,
        content: payload.content,   // <-- full JSON
      }]);

      if (error) throw error;

      // send them to My Listings and refresh data there
      router.push('/my-listings');
    } catch (err: any) {
      alert(err?.message ?? 'Failed to save listing');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={className ?? 'rounded-xl bg-white px-3 py-2 text-black'}
    >
      {busy ? 'Saving…' : children}
    </button>
  );
}
