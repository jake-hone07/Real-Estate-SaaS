"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setEmail(sess?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const link = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`rounded-md px-2 py-1 text-sm ${active ? "border border-gray-600 bg-white/5" : "hover:bg-white/5"}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-800 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 p-3">
        <Link href="/" className="font-semibold">ListingForge</Link>

        <div className="flex items-center gap-1">
          {link("/generate", "Generate")}
          {link("/my-listings", "My Listings")}
          {link("/billing", "Billing")}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {email ? (
            <>
              <span className="hidden text-xs text-gray-400 md:inline">{email}</span>
              <button
                onClick={signOut}
                className="rounded-md border border-gray-700 px-2 py-1 text-sm"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-gray-700 px-2 py-1 text-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
