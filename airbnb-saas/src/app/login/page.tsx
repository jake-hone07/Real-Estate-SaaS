import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <Suspense fallback={<div className="h-24 animate-pulse bg-gray-100 rounded" />}>
        <LoginClient />
      </Suspense>
    </main>
  );
}
