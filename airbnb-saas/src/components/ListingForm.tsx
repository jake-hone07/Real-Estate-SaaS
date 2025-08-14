'use client';

import { useState } from 'react';

type FormValues = { title: string; prompt: string };
type Props = {
  onGenerate: (formData: FormValues) => Promise<void> | void;
  credits: number | null;
  fetchCredits: () => Promise<void> | void;
  submitting?: boolean;
};

export default function ListingForm({ onGenerate, credits, fetchCredits, submitting = false }: Props) {
  const [form, setForm] = useState<FormValues>({ title: '', prompt: '' });
  const canGenerate = (credits ?? 0) > 0 && !submitting;

  const handleChange =
    (key: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerate(form);
    await fetchCredits();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-gray-600">Title</label>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="e.g., 123 Oakwood Lane, Springfield"
            value={form.title}
            onChange={handleChange('title')}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-gray-600">Facts / Prompt</label>
          <textarea
            className="w-full rounded border px-3 py-2"
            rows={8}
            placeholder="Add concrete facts. The generator only uses what you provide—no made-up details."
            value={form.prompt}
            onChange={handleChange('prompt')}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Credits:{' '}
          {credits === null ? <span className="text-red-600">unavailable</span> : <span>{credits}</span>}
        </div>
        <button
          type="submit"
          disabled={!canGenerate}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
            canGenerate ? 'bg-black hover:opacity-90' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Generating…' : 'Generate Listing'}
        </button>
      </div>
    </form>
  );
}
