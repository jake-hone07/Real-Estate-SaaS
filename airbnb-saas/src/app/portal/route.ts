// app/portal/route.ts
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.redirect('/api/billing/portal', { status: 302 });
}
