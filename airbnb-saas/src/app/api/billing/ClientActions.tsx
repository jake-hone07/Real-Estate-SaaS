// app/billing/ClientActions.tsx
'use client';

import { openBillingPortal } from '@/lib/client/stripe';

export default function ClientActions() {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <button
        onClick={openBillingPortal}
        className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
      >
        Manage Billing
      </button>
    </div>
  );
}
