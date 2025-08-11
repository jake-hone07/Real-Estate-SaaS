// src/lib/billing.ts
export const PLANS = {
  starter: { name: 'Starter', priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!, credits: 50, priceLabel: '$9/mo' },
  pro:     { name: 'Pro',     priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!,     credits: 200, priceLabel: '$29/mo' },
  team:    { name: 'Team',    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM!,    credits: 800, priceLabel: '$79/mo' },
} as const;

export function creditsForPriceId(priceId: string) {
  const m = Object.values(PLANS).find(p => p.priceId === priceId);
  return m?.credits ?? 0;
}
