// src/lib/billing.ts

export type PlanMode = 'subscription' | 'payment';

export type PlanDef = {
  name: string;
  credits: number;
  priceId: string;      // Stripe Price ID (price_...)
  priceLabel: string;   // UI-only
  mode: PlanMode;
};

export const PLANS = {
  // Canonical keys — keep these stable
  Starter: {
    name: 'Starter',
    credits: 20,                          // whatever you want to show in UI
    priceId: process.env.NEXT_PUBLIC_STARTER_PRICE_ID ?? '',
    priceLabel: '$9.99/mo',
    mode: 'subscription' as const,
  },
  Premium: {
    name: 'Premium',
    credits: Infinity as unknown as number, // just a display idea for “unlimited”
    priceId: process.env.NEXT_PUBLIC_PREMIUM_PRICE_ID ?? '',
    priceLabel: 'Unlimited (Premium)',
    mode: 'subscription' as const,
  },
  CREDITS_15: {
    name: '15 Credits',
    credits: 15,
    priceId: process.env.NEXT_PUBLIC_COINS_PRICE_ID ?? '',
    priceLabel: '$10 one-time',           // your actual price label
    mode: 'payment' as const,
  },
} satisfies Record<string, PlanDef>;

export type CanonicalPlanKey = keyof typeof PLANS;

// Map anything the UI or old code sends → canonical keys above
export const ALIASES: Record<string, CanonicalPlanKey> = {
  starter: 'Starter',
  basic: 'Starter',

  premium: 'Premium',
  pro: 'Premium',          // if anything still says “pro”, it will still work

  coins15: 'CREDITS_15',
  '15_credits': 'CREDITS_15',
  '15credits': 'CREDITS_15',
  credits_15: 'CREDITS_15',
  pack15: 'CREDITS_15',
};

export function resolvePlanKey(input?: string): CanonicalPlanKey | null {
  if (!input) return null;
  if (input in PLANS) return input as CanonicalPlanKey;
  const lower = input.toLowerCase();
  return ALIASES[lower] ?? null;
}

export function getPlan(input?: string) {
  const key = resolvePlanKey(input);
  return key ? { key, def: PLANS[key] } : null;
}

export const DISPLAY_ORDER: CanonicalPlanKey[] = ['Starter', 'Premium', 'CREDITS_15'];

// Quick env sanity warning (dev only)
for (const k of Object.keys(PLANS) as CanonicalPlanKey[]) {
  if (!PLANS[k].priceId) {
    // eslint-disable-next-line no-console
    console.warn(`[billing] Missing priceId for "${k}". Did you set NEXT_PUBLIC_* env vars on Vercel?`);
  }
}
