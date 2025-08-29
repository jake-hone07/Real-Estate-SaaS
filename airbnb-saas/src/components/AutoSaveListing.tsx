'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { NewListing } from '@/lib/supabase';

type Props = {
  payload: NewListing;             // listing fields to save
  enabled?: boolean;               // default true
  debounceMs?: number;             // default 800ms
  redirectOnSave?: boolean;        // default false
};

function hashString(s: string) {
  // simple FNV-1a-ish hash for dedupe
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export default function AutoSaveListing({
  payload,
  enabled = true,
  debounceMs = 800,
  redirectOnSave = false,
}: Props) {
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHashRef = useRef<string | null>(null);

  // normalize + hash to detect meaningful changes
  const normalized = useMemo(() => {
    const p = {
      ...payload,
      price: Number(payload.price) || 0,
      bedrooms: Number(payload.bedrooms) || 0,
      bathrooms: Number(payload.bathrooms) || 0,
      squareFeet: Number(payload.squareFeet) || 0,
      features: payload.features ?? '',
      tone: payload.tone ?? '',
      translate: !!payload.translate,
    };
    return p;
  }, [payload]);

  const sig = useMemo(() => hashString(JSON.stringify(normalized)), [normalized]);

  useEffect(() => {
    if (!enabled) return;

    // prevent duplicate saves of the exact same data
    if (lastSavedHashRef.current === sig) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        setErr(null);
        const res = await fetch('/api/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalized),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || 'Failed to auto-save');
        lastSavedHashRef.current = sig;
        if (redirectOnSave) window.location.href = '/my-listings';
      } catch (e: any) {
        setErr(e.message || 'Auto-save failed');
      }
    }, debounceMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [sig, normalized, enabled, debounceMs, redirectOnSave]);

  // no visible UI (silent), but helpful in dev
  return err ? <span className="text-xs text-red-500">{err}</span> : null;
}
