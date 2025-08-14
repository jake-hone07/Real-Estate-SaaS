import { Suspense } from "react";
import ListingClient from "./ListingClient";

export const metadata = {
  title: "Generate Listing",
  description: "Turn your property facts into a market-ready listing.",
};

// If this page truly depends on search params and you want to avoid static render issues,
// you can uncomment the next line. Prefer the split + Suspense first.
// export const dynamic = "force-dynamic";

export default function ListingPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Listing Generator</h1>
        <p className="text-gray-600">
          Paste your property facts and generate a polished description.
        </p>
      </header>

      {/* Client-only logic (search params, router, etc.) lives here */}
      <Suspense fallback={<div className="animate-pulse h-24 bg-gray-100 rounded" />}>
        <ListingClient />
      </Suspense>
    </main>
  );
}
