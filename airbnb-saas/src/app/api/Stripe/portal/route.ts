import { NextRequest, NextResponse } from "next/server";
import { stripe, APP_URL } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const customers = await stripe.customers.search({
      query: `email:'${email.replace(/'/g, "\\'")}'`,
      limit: 1,
    });

    const customer = customers.data[0];
    if (!customer) {
      return NextResponse.json(
        { error: "No Stripe customer found for this email." },
        { status: 404 }
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${APP_URL}/billing`,
    });

    if (!portal.url) {
      return NextResponse.json({ error: "No portal URL from Stripe" }, { status: 500 });
    }
    return NextResponse.json({ url: portal.url });
  } catch (err: any) {
    return NextResponse.json(
      { error: String(err?.message || err || "Server error") },
      { status: 500 }
    );
  }
}
