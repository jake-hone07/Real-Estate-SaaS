"use client";

import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");

  if (!q) return null;

  return (
    <p className="mt-3 text-sm text-gray-500">
      We couldn’t find: “{q}”.
    </p>
  );
}
