// lib/billing.ts
// Source of truth for plans and price IDs. Uses your env names.

export type PlanMode = 'subscription' | 'payment';

export type PlanDef = {
  name: string;          // Display name
  credits: number;       // Credits granted per purchase/billing cycle (0 for Premium/unlimited)
  priceId: string;       // Stripe Price ID (price_...)
  priceLabel: string;    // UI label (e.g., "$9.99", "$29.99/mo")
  mode: PlanMode;        // 'payment' (one-time) or 'subscription'
};

export type PlanKey = 'Starter' | 'Premium' | 'Coins';

function anyEnv(...names: string[]): string {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim() !== '') return v.trim();
  }
  throw new Error(`Missing environment variable: one of [${names.join(', ')}]`);
}

// ===== Pricing & credit amounts =====
export const STARTER_MONTHLY_CREDITS = 25;     // ← your chosen Starter amount
export const COINS_TOPUP_CREDITS = 15;         // ← top-up credits
// Premium is unlimited (no monthly credits)

// ===== Plans =====
const INTERNAL_PLANS: Record<PlanKey, PlanDef> = {
  Starter: {
    name: 'Starter',
    credits: STARTER_MONTHLY_CREDITS,
    priceId: anyEnv('STARTER_PRICE_ID', 'NEXT_PUBLIC_STARTER_PRICE_ID'),
    priceLabel: '$9.99/mo',
    mode: 'subscription',
  },
  Premium: {
    name: 'Premium',
    credits: 0, // unlimited (no monthly grant)
    priceId: anyEnv('PREMIUM_PRICE_ID', 'NEXT_PUBLIC_PREMIUM_PRICE_ID'),
    priceLabel: '$29.99/mo',
    mode: 'subscription',
  },
  Coins: {
    name: 'Top-Up (15 credits)',
    credits: COINS_TOPUP_CREDITS,
    priceId: anyEnv('COINS_PRICE_ID', 'NEXT_PUBLIC_COINS_PRICE_ID'),
    priceLabel: '$10 one-time',
    mode: 'payment',
  },
};

// Preferred exports
export const ALL_PLANS: ReadonlyArray<{ key: PlanKey; def: PlanDef }> = (
  Object.keys(INTERNAL_PLANS) as PlanKey[]
).map((k) => ({ key: k, def: INTERNAL_PLANS[k] }));

export function getPlan(maybeKey?: string | null): { key: PlanKey; def: PlanDef } | null {
  if (!maybeKey) return null;
  const key = maybeKey as PlanKey;
  const def = INTERNAL_PLANS[key];
  return def ? { key, def } : null;
}

export function priceIdToPlanKey(priceId?: string | null): PlanKey | null {
  if (!priceId) return null;
  for (const key of Object.keys(INTERNAL_PLANS) as PlanKey[]) {
    if (INTERNAL_PLANS[key].priceId === priceId) return key;
  }
  return null;
}

export function listPlans(): Array<{ key: PlanKey; name: string; priceLabel: string; mode: PlanMode; credits: number }> {
  return (Object.keys(INTERNAL_PLANS) as PlanKey[]).map((key) => {
    const def = INTERNAL_PLANS[key];
    return { key, name: def.name, priceLabel: def.priceLabel, mode: def.mode, credits: def.credits };
  });
}

/* ---------- Back-compat exports (if other files import these) ---------- */
export const PLANS: Record<PlanKey, PlanDef> = INTERNAL_PLANS;
export const DISPLAY_ORDER: PlanKey[] = ['Starter', 'Premium', 'Coins'];
/* --------------------------------------------------------------------- */
