import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// no apiVersion field — keeps TS happy across SDK updates
