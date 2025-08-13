// app/billing/BuyButton.client.tsx
'use client';

import { startCheckout } from '@/lib/client/stripe';

export function BuyButton({
  planKey,
  className,
}: {
  planKey: string;
  className?: string;
}) {
  return (
    <button
      onClick={() => startCheckout(planKey)}
      className={
        className ??
        'rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90'
      }
    >
      Buy {planKey}
    </button>
  );
}
