'use client';
import { useState } from 'react';

export default function CreditsModal({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-xl font-semibold">You’re out of credits</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Buy a coin pack or go Premium (unlimited) to keep generating.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a href="/pricing"
             className="flex-1 rounded-xl bg-zinc-900 px-4 py-2 text-center text-white hover:bg-zinc-800">
            View Pricing
          </a>
          <button onClick={onClose}
                  className="flex-1 rounded-xl border px-4 py-2 hover:bg-zinc-50">
            Not now
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Starter refills 20 credits each month. Premium is unlimited.
        </p>
      </div>
    </div>
  );
}
