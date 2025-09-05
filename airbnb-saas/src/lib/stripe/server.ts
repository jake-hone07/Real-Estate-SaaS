import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

// Canonical base URL used in success/cancel/return links
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

/**
 * Price IDs
 * Your env already has:
 *  - STARTER_PRICE_ID (subscription)
 *  - PREMIUM_PRICE_ID (optional second sub tier)
 *  - COINS_PRICE_ID (one-time credits)
 * Also support fallback names I used earlier.
 */
export const PRICE_ID_SUB =
  process.env.STARTER_PRICE_ID ||
  process.env.STRIPE_PRICE_ID_SUB ||
  ""; // required for subscription

export const PRICE_ID_CREDITS =
  process.env.COINS_PRICE_ID ||
  process.env.STRIPE_PRICE_ID_CREDITS ||
  ""; // required for one-time credits
