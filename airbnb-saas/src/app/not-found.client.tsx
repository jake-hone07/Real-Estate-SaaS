"use client";
import { useSearchParams } from "next/navigation";

export default function NotFoundClient() {
  const sp = useSearchParams();
  const q = sp.get("q"); // optional: show context like ?q=something
  if (!q) return null;
  return (
    <p className="mt-3 text-sm text-gray-500">
      We couldn’t find: “{q}”.
    </p>
  );
}
