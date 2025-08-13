// lib/billing.ts
// Central source of truth for plans/pricing used by Checkout, UI, and Webhooks.

export type PlanMode = 'subscription' | 'payment';

export type PlanDef = {
  name: string;          // Display name
  credits: number;       // Credits granted per purchase/billing cycle
  priceId: string;       // Stripe Price ID (price_xxx)
  priceLabel: string;    // Shown on UI (e.g., "$9", "$29/mo")
  mode: PlanMode;        // 'payment' (one-time) or 'subscription'
};

export type PlanKey = 'Starter' | 'Premium'; // Add/remove keys as needed

// ====== EDIT THESE PRICE IDS ======
// Put your real Stripe Price IDs here. Keep the rest as-is.
const PLANS: Record<PlanKey, PlanDef> = {
  Starter: {
    name: 'Starter',
    credits: 50,
    priceId: 'price_STARTER_REPLACE_ME', // <-- replace with real Stripe price id
    priceLabel: '$9',
    mode: 'payment',
  },
  Premium: {
    name: 'Premium',
    credits: 200,
    priceId: 'price_PREMIUM_REPLACE_ME', // <-- replace with real Stripe price id
    priceLabel: '$29/mo',
    mode: 'subscription',
  },
};
// ==================================

// Export a readonly list for UIs
export const ALL_PLANS: ReadonlyArray<{ key: PlanKey; def: PlanDef }> = (
  Object.keys(PLANS) as PlanKey[]
).map((k) => ({ key: k, def: PLANS[k] }));

/**
 * Resolve a plan by key. If `maybeKey` is undefined/null or invalid, returns null.
 * This is what the checkout route expects: `{ key, def } | null`.
 */
export function getPlan(maybeKey?: string | null): { key: PlanKey; def: PlanDef } | null {
  if (!maybeKey) return null;
  const key = maybeKey as PlanKey;
  const def = PLANS[key];
  return def ? { key, def } : null;
}

/**
 * Optional: reverse lookup from Stripe Price ID → PlanKey.
 * Useful inside webhooks if you ever prefer mapping by priceId instead of metadata.
 */
export function priceIdToPlanKey(priceId?: string | null): PlanKey | null {
  if (!priceId) return null;
  for (const key of Object.keys(PLANS) as PlanKey[]) {
    if (PLANS[key].priceId === priceId) return key;
  }
  return null;
}

/**
 * Optional helper to display plans on pricing pages.
 */
export function listPlans(): Array<{ key: PlanKey; name: string; priceLabel: string; mode: PlanMode; credits: number }> {
  return (Object.keys(PLANS) as PlanKey[]).map((key) => {
    const def = PLANS[key];
    return { key, name: def.name, priceLabel: def.priceLabel, mode: def.mode, credits: def.credits };
  });
}
