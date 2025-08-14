import { Suspense } from "react";
import NotFoundClient from "./not-found.client";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-gray-400">The page you’re looking for doesn’t exist.</p>
      <Suspense fallback={null}>
        <NotFoundClient />
      </Suspense>
      <a href="/" className="mt-6 inline-block rounded-md border border-border px-4 py-2 hover:bg-white/5">
        Go home
      </a>
    </main>
  );
}
