import { NextRequest, NextResponse } from "next/server";
import { stripe, APP_URL, PRICE_ID_CREDITS, PRICE_ID_SUB } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { email, mode } = (await req.json()) as {
      email?: string;
      mode: "credits" | "subscription";
    };

    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
    if (mode !== "credits" && mode !== "subscription") {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const priceId = mode === "credits" ? PRICE_ID_CREDITS : PRICE_ID_SUB;
    if (!priceId) {
      return NextResponse.json(
        { error: "Missing Stripe price ID in environment" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: mode === "credits" ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      success_url: `${APP_URL}/billing?success=1`,
      cancel_url: `${APP_URL}/billing?canceled=1`,
      allow_promotion_codes: true,
      metadata: { app: "ListingForge", flow: mode },
    });

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL from Stripe" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json(
      { error: String(err?.message || err || "Server error") },
      { status: 500 }
    );
  }
}
