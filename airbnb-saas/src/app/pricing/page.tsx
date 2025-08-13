// app/pricing/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PricingRedirect() {
  // One source of truth: Billing page
  redirect('/billing');
}
