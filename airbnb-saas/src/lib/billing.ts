// src/lib/billing.ts

export type PlanMode = 'subscription' | 'payment';

export type PlanDef = {
  name: string;
  credits: number;
  priceId: string;      // Stripe Price ID (price_...)
  priceLabel: string;   // For UI only
  mode: PlanMode;
};

export const PLANS = {
  // Canonical keys (don’t change these without updating ALIASES below)
  Starter: {
    name: 'Starter',
    credits: 50,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? '',
    priceLabel: '$9/mo',
    mode: 'subscription' as const,
  },
  Pro: {
    name: 'Pro',
    credits: 200,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? '',
    priceLabel: '$29/mo',
    mode: 'subscription' as const,
  },
  CREDITS_100: {
    name: '100 Credits',
    credits: 100,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_100 ?? '',
    priceLabel: '$12 one-time',
    mode: 'payment' as const,
  },
  CREDITS_400: {
    name: '400 Credits',
    credits: 400,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_400 ?? '',
    priceLabel: '$40 one-time',
    mode: 'payment' as const,
  },
} satisfies Record<string, PlanDef>;

export type CanonicalPlanKey = keyof typeof PLANS;

// Accept legacy / lowercase / marketing names here.
// Left side = what the client might send; right side = canonical key in PLANS.
export const ALIASES: Record<string, CanonicalPlanKey> = {
  starter: 'Starter',
  basic: 'Starter',
  pro: 'Pro',
  premium: 'Pro',

  coins15: 'CREDITS_100',     // if you ever used “coins15” earlier
  credits_100: 'CREDITS_100',
  credits100: 'CREDITS_100',
  pack100: 'CREDITS_100',

  credits_400: 'CREDITS_400',
  credits400: 'CREDITS_400',
  pack400: 'CREDITS_400',
};

export function resolvePlanKey(input?: string): CanonicalPlanKey | null {
  if (!input) return null;
  // exact canonical key?
  if (input in PLANS) return input as CanonicalPlanKey;
  // alias (case-insensitive)
  const lower = input.toLowerCase();
  return ALIASES[lower] ?? null;
}

export function getPlan(input?: string) {
  const key = resolvePlanKey(input);
  return key ? { key, def: PLANS[key] } : null;
}

// Just for the pricing UI (what order to render)
export const DISPLAY_ORDER: CanonicalPlanKey[] = [
  'Starter',
  'Pro',
  'CREDITS_100',
  'CREDITS_400',
];

// Quick env guard to help catch misconfig in dev
for (const k of Object.keys(PLANS) as CanonicalPlanKey[]) {
  if (!PLANS[k].priceId) {
    // eslint-disable-next-line no-console
    console.warn(`[billing] Missing priceId for plan "${k}". Check your Vercel env vars.`);
  }
}
