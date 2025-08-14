import { Suspense } from "react";
import GenerateClient from "./GenerateClient";

export const metadata = {
  title: "Listing Generator",
  description: "Turn property facts into a market-ready listing in seconds.",
};

export default function GeneratePage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Listing Generator</h1>
        <p className="mt-1 text-gray-400">
          Paste property details, choose tone and length, and generate a polished description.
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
            <div className="animate-pulse h-80 rounded border border-gray-700" />
          </div>
        }
      >
        <GenerateClient />
      </Suspense>
    </main>
  );
}
