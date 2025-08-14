import "./globals.css";
import { Suspense } from "react";
import AppHeader from "@/components/AppHeader";

export const metadata = {
  title: "ListingForge",
  description: "Turn property facts into market-ready listings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Any client component using next/navigation hooks must be inside Suspense */}
        <Suspense fallback={null}>
          <AppHeader />
        </Suspense>
        <div className="min-h-[calc(100vh-64px)]">{children}</div>
      </body>
    </html>
  );
}
