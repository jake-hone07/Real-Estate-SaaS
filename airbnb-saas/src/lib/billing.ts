// src/lib/billing.ts
export const PLANS = {
  Starter: {
    name: 'Starter',
    credits: 50,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER!,
    priceLabel: '$9/mo',
    mode: 'subscription' as const,
  },
  Pro: {
    name: 'Pro',
    credits: 200,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO!,
    priceLabel: '$29/mo',
    mode: 'subscription' as const,
  },
  CREDITS_100: {
    name: '100 Credits',
    credits: 100,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_100!,
    priceLabel: '$12 one-time',
    mode: 'payment' as const,
  },
  CREDITS_400: {
    name: '400 Credits',
    credits: 400,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_400!,
    priceLabel: '$40 one-time',
    mode: 'payment' as const,
  },
};
