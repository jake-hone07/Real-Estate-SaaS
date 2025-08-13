// app/billing/portal/route.ts
// Compatibility shim: if any button links to /billing/portal,
// redirect to the API handler that creates the Stripe Portal session.
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.redirect('/api/billing/portal', { status: 302 });
}
