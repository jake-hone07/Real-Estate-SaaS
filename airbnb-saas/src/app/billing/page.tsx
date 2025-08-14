import { Suspense } from "react";
import BillingClient from "./BillingClient";

export const metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Billing</h1>
      <Suspense fallback={<div className="h-24 animate-pulse bg-gray-100 rounded" />}>
        <BillingClient />
      </Suspense>
    </main>
  );
}
