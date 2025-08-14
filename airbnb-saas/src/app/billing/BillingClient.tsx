"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function BillingClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const status = sp.get("status");

  // ...your billing UI...
  return <div>{status ? `Status: ${status}` : "Manage your subscription"}</div>;
}
