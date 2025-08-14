import { Suspense } from "react";
import GenerateClient from "./GenerateClient";

export const metadata = { title: "Generate Listing" };

export default function GeneratePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-2">Listing Generator</h1>
      <p className="text-gray-600 mb-4">Paste your property facts and generate a polished description.</p>
      <Suspense fallback={<div className="h-24 animate-pulse bg-gray-100 rounded" />}>
        <GenerateClient />
      </Suspense>
    </main>
  );
}
