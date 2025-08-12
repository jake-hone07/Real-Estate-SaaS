'use client';

import { useEffect, useState } from 'react';
import CreditsModal from '@/components/CreditsModal';

type Plan = 'free' | 'starter' | 'premium';

type FormState = {
  address?: string;
  bedrooms?: string;
  bathrooms?: string;
  squareFeet?: string;
  features?: string;
  tone?: string;
  translate?: boolean;
  neighborhood?: string;
  interiorStyle?: string;
  renovations?: string;
  outdoorFeatures?: string;
  nearbyAmenities?: string;
  hoaInfo?: string;
  template?: 'default' | 'luxury' | 'rental' | 'vacation' | 'flip';
};

export default function GeneratePage() {
  const [form, setForm] = useState<FormState>({ tone: 'Professional', template: 'default' });
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [plan, setPlan] = useState<Plan>('free');
  const [creditLabel, setCreditLabel] = useState<string>('—');

  // Fetch plan/credits for badge + gating
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/me/profile');
        if (!r.ok) return;
        const { data } = await r.json();
        const p: Plan = (data?.plan ?? 'free') as Plan;
        setPlan(p);
        setCreditLabel(p === 'premium' ? 'Unlimited' : String(data?.credits ?? 0));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setOutput('');
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    // Out of credits
    if (res.status === 402) {
      setShowCreditsModal(true);
      return;
    }
    // Pro template lock
    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      alert(data?.message || 'This template requires Premium.');
      return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Generate failed');

    setOutput(data.listing || '');

    // ✅ Always overwrite plan & credits from API
    if (data?.plan) {
      setPlan(data.plan as Plan);
      setCreditLabel(
        data.plan === 'premium'
          ? 'Unlimited'
          : String(data.credits ?? 0) // always use API number, fallback to 0
      );
    }
  } catch (err: any) {
    alert(err?.message || 'Something went wrong.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Create a Listing</h1>
          <p className="mt-1 text-zinc-500">Facts-only generator. ~20–30 seconds.</p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full border ${
            plan === 'premium' ? 'border-indigo-500 text-indigo-600' : 'border-zinc-300 text-zinc-600'
          }`}
          title={plan === 'premium' ? 'Premium' : 'Starter/Free'}
        >
          {creditLabel}
        </span>
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-2xl border p-6">
        {/* Basics */}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="address" label="Address" placeholder="123 Main St" onChange={onChange} />
          <TextField name="neighborhood" label="Neighborhood" placeholder="Old Town" onChange={onChange} />
          <TextField name="bedrooms" label="Bedrooms" placeholder="3" onChange={onChange} />
          <TextField name="bathrooms" label="Bathrooms" placeholder="2" onChange={onChange} />
          <TextField name="squareFeet" label="Square feet" placeholder="1800" onChange={onChange} />
          <TextField
            name="nearbyAmenities"
            label="Nearby amenities"
            placeholder="Trails, parks, grocery"
            onChange={onChange}
          />
        </div>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Special features</span>
          <textarea
            name="features"
            onChange={onChange}
            className="min-h-[90px] rounded-xl border px-3 py-2"
            placeholder="Vaulted ceilings, new windows, fenced yard"
          />
        </label>

        {/* Template selector + tone */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Template</span>
            <select
              name="template"
              value={form.template}
              onChange={onChange}
              className="rounded-xl border px-3 py-2"
            >
              <option value="default">Default</option>
              <option value="rental">Rental</option>
              <option value="vacation">Vacation Home</option>
              <option value="flip">Investor Flip</option>
              <option value="luxury" disabled={plan !== 'premium'}>
                Luxury (Pro)
              </option>
            </select>
            {plan !== 'premium' && (
              <span className="mt-1 text-xs text-zinc-500">
                🔒 Luxury template is a Premium feature.{' '}
                <a href="/pricing" className="text-indigo-600 hover:underline">
                  Upgrade for Unlimited + Pro templates
                </a>
              </span>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Tone</span>
            <select
              name="tone"
              defaultValue="Professional"
              onChange={onChange}
              className="rounded-xl border px-3 py-2"
            >
              <option>Professional</option>
              <option>Warm</option>
              <option>Concise</option>
              <option>Luxury</option>
              <option>Investor</option>
            </select>
          </label>
        </div>

        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="translate" onChange={onChange} className="h-4 w-4" />
          <span className="text-sm">Also provide a Spanish version</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
              Crafting your perfect listing…
            </>
          ) : (
            'Generate'
          )}
        </button>
      </form>

      {/* Output */}
      {output && (
        <div className="mt-6 rounded-2xl border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Result</h2>
            <button
              onClick={() => navigator.clipboard.writeText(output)}
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Copy
            </button>
          </div>
          <pre className="mt-3 whitespace-pre-wrap text-sm">{output}</pre>
        </div>
      )}

      <CreditsModal open={showCreditsModal} onClose={() => setShowCreditsModal(false)} />
    </div>
  );
}

/* ---------- small UI helpers ---------- */

function TextField({
  name,
  label,
  placeholder,
  onChange,
}: {
  name: string;
  label: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        onChange={onChange}
        className="rounded-xl border px-3 py-2"
        placeholder={placeholder}
      />
    </label>
  );
}
