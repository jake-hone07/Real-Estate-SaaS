'use client';

import { useEffect, useState } from 'react';

type MeResponse = {
  user?: { id: string; email?: string | null };
  credits?: number;
  plan?: string;
  error?: string;
};

export default function AccountStatus() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/me', { cache: 'no-store' });
        const json = (await res.json()) as MeResponse;
        if (alive) setData(json);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !data || data.error) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="px-2 py-1 rounded bg-neutral-800/60">Plan: {data.plan}</span>
      <span className="px-2 py-1 rounded bg-neutral-800/60">Credits: {data.credits}</span>
    </div>
  );
}
