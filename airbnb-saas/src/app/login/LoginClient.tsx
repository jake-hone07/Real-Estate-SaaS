"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function LoginClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirect = sp.get("redirect") || "/dashboard";

  // ...your login form logic; on success:
  // router.push(redirect);

  return (
    <form className="space-y-3">
      {/* your inputs */}
      <button className="rounded-md border px-4 py-2">Continue</button>
    </form>
  );
}
