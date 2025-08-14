import { Suspense } from "react";
import GenerateClient from "./GenerateClient";

export const metadata = {
  title: "Listing Generator",
  description: "Turn property facts into a booking-ready Airbnb listing.",
};

export default function GeneratePage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Listing Generator</h1>
        <p className="mt-1 text-gray-400">
          Enter your property details, pick a tone and audience, and generate a structured,
          copy-paste-ready listing with live preview.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="grid gap-6 md:grid-cols-2">
            <div className="animate-pulse space-y-3">
              <div className="h-10 w-56 rounded bg-gray-800/40" />
              <div className="h-40 rounded bg-gray-800/40" />
              <div className="h-10 w-40 rounded bg-gray-800/40" />
            </div>
            <div className="animate-pulse h-96 rounded border border-gray-700" />
          </div>
        }
      >
        <GenerateClient />
      </Suspense>
    </main>
  );
}
