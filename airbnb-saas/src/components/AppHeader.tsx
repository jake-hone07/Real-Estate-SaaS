"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();

  const NavLink = ({ href, label }: { href: string; label: string }) => (
    <Link
      href={href}
      className={`px-2 py-1.5 text-sm rounded-md hover:bg-white/5 ${
        pathname === href ? "font-semibold" : "text-zinc-300"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-border">
      <Link href="/" className="font-semibold">ListingForge</Link>
      <nav className="flex gap-2">
        <NavLink href="/generate" label="Generate" />
        <NavLink href="/billing" label="Billing" />
        <NavLink href="/login" label="Login" />
      </nav>
    </header>
  );
}
