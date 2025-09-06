import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

// Stripe requires raw body
export const config = { api: { bodyParser: false } };

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const PRICE_STARTER =
  process.env.STARTER_PRICE_ID || process.env.NEXT_PUBLIC_STARTER_PRICE_ID;
const PRICE_PREMIUM =
  process.env.PREMIUM_PRICE_ID || process.env.NEXT_PUBLIC_PREMIUM_PRICE_ID;
const PRICE_COINS =
  process.env.COINS_PRICE_ID || process.env.NEXT_PUBLIC_COINS_PRICE_ID;

const PRICE_TO_PLAN: Record<string, "basic" | "premium" | undefined> = {
  ...(PRICE_STARTER ? { [PRICE_STARTER]: "basic" } : {}),
  ...(PRICE_PREMIUM ? { [PRICE_PREMIUM]: "premium" } : {}),
};

const PRICE_TO_CREDITS: Record<string, number> = {
  ...(PRICE_COINS ? { [PRICE_COINS]: 500 } : {}),
};

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function findUserIdByCustomerId(customerId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id as string | undefined;
}

async function setPlanFromSubscription(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = await findUserIdByCustomerId(customerId);
  if (!userId) return;

  const priceId = sub.items.data[0]?.price?.id ?? "";
  const plan = PRICE_TO_PLAN[priceId] ?? "free";
  const status = sub.status;
  const currentPeriodEnd =
    (sub as any).current_period_end != null
      ? new Date((sub as any).current_period_end * 1000).toISOString()
      : null;

  await supabaseAdmin
    .from("profiles")
    .update({
      plan,
      plan_status: status,
      plan_renews_at: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

async function getCurrentCredits(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  return (data?.credits as number) ?? 0;
}

async function grantCreditsFromCheckout(session: Stripe.Checkout.Session) {
  if (session.mode !== "payment") return;

  const items = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 10,
  });

  const totalCredits = items.data.reduce((sum, li) => {
    const priceId = (li.price as Stripe.Price | null)?.id ?? "";
    const qty = li.quantity ?? 1;
    const credits = PRICE_TO_CREDITS[priceId] ?? 0;
    return sum + credits * qty;
  }, 0);

  if (totalCredits <= 0) return;

  let userId = session.metadata?.supabase_user_id as string | undefined;
  if (!userId && session.customer) {
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer.id;
    userId = await findUserIdByCustomerId(customerId);
  }
  if (!userId) return;

  try {
    await supabaseAdmin.rpc("increment_credits", {
      p_user_id: userId,
      p_delta: totalCredits,
    });
  } catch {
    const current = await getCurrentCredits(userId);
    await supabaseAdmin
      .from("profiles")
      .update({
        credits: current + totalCredits,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  try {
    await supabaseAdmin.from("credits_ledger").insert({
      user_id: userId,
      delta: totalCredits,
      reason: "purchase:coins_pack",
      stripe_payment_intent: (session.payment_intent as string) ?? null,
    });
  } catch {}
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const raw = await readRawBody(req);
    const sig = req.headers["stripe-signature"] as string | undefined;
    if (!sig) return res.status(400).send("Missing stripe-signature");

    const event = stripe.webhooks.constructEvent(
      raw,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await setPlanFromSubscription(sub);
        } else if (session.mode === "payment") {
          await grantCreditsFromCheckout(session);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await setPlanFromSubscription(sub);
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (e: any) {
    console.error("[api/stripe/webhook] error:", e?.message || e);
    return res.status(400).send(`Webhook Error: ${e?.message ?? "unknown"}`);
  }
}
