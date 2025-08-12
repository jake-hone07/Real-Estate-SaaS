'use client';

import { useEffect, useState } from 'react';

type Step = {
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

const STEPS: Step[] = [
  {
    title: 'Create in 60 seconds',
    body: 'Enter property facts, pick a template, click Generate. No guesswork, no prompting.',
    cta: { label: 'Start your first listing', href: '/generate' },
  },
  {
    title: 'Templates & tone',
    body: 'Use Default, Rental, Vacation, or Flip. Upgrade for Luxury (Pro). Tone controls the voice, not the facts.',
  },
  {
    title: 'Credits & Premium',
    body: 'Starter refills 20 credits monthly. Premium is unlimited with Pro templates and priority speed.',
    cta: { label: 'See pricing', href: '/pricing' },
  },
];

export default function OnboardingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  if (!open) return null;
  const step = STEPS[i];

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold">{step.title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mt-3 text-zinc-600">{step.body}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {step.cta && (
            <a
              href={step.cta.href}
              className="rounded-xl bg-zinc-900 text-white px-4 py-2 hover:bg-zinc-800"
              onClick={onClose}
            >
              {step.cta.label}
            </a>
          )}
          {i < STEPS.length - 1 ? (
            <button
              onClick={() => setI((n) => Math.min(n + 1, STEPS.length - 1))}
              className="rounded-xl border px-4 py-2 hover:bg-zinc-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={onClose}
              className="rounded-xl border px-4 py-2 hover:bg-zinc-50"
            >
              Done
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-sm text-zinc-500 hover:text-zinc-700"
          >
            Skip
          </button>
        </div>

        {/* Dots */}
        <div className="mt-4 flex items-center gap-1">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 w-5 rounded-full ${
                idx === i ? 'bg-zinc-900' : 'bg-zinc-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
