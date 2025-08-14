"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const router = useRouter();

  // (keep your existing header logic; this just ensures it's client-only)
  return (
    <header className="h-16 flex items-center justify-between px-4 border-b">
      <Link href="/" className="font-semibold">ListingForge</Link>
      {/* ...rest of your header... */}
      <nav className="flex gap-4 text-sm">
        <Link href="/generate" className={pathname === "/generate" ? "font-medium" : ""}>
          Generate
        </Link>
        <Link href="/billing" className={pathname === "/billing" ? "font-medium" : ""}>
          Billing
        </Link>
        <Link href="/login" className={pathname === "/login" ? "font-medium" : ""}>
          Login
        </Link>
      </nav>
    </header>
  );
}
