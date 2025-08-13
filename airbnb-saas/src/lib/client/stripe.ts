// lib/client/stripe.ts
'use client';

/**
 * Starts a Stripe Checkout session for the given planKey
 * and redirects the browser to the hosted checkout page.
 *
 * Usage (in a client component):
 *   import { startCheckout } from '@/lib/client/stripe';
 *   <button onClick={() => startCheckout('Starter')}>Buy</button>
 */

let inFlight = false;

export async function startCheckout(planKey: string): Promise<void> {
  if (!planKey) throw new Error('Missing plan key');
  if (inFlight) return; // ignore double-clicks
  inFlight = true;

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ planKey }),
    });

    // Try to parse JSON even on error to surface server message
    const data = await res
      .json()
      .catch(() => ({} as { url?: string; error?: string }));

    if (!res.ok) {
      throw new Error(data?.error || `Checkout failed (${res.status})`);
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned from server');
    }

    // Redirect to Stripe
    window.location.href = data.url as string;
  } finally {
    inFlight = false;
  }
}

/**
 * Opens the Stripe Billing Portal for the current user (if you wired /api/billing/portal).
 *
 * Usage:
 *   import { openBillingPortal } from '@/lib/client/stripe';
 *   <button onClick={openBillingPortal}>Manage Billing</button>
 */
export async function openBillingPortal(): Promise<void> {
  if (inFlight) return;
  inFlight = true;

  try {
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
    });

    const data = await res
      .json()
      .catch(() => ({} as { url?: string; error?: string }));

    if (!res.ok) {
      throw new Error(data?.error || `Portal failed (${res.status})`);
    }

    if (!data?.url) {
      throw new Error('No portal URL returned from server');
    }

    window.location.href = data.url as string;
  } finally {
    inFlight = false;
  }
}
