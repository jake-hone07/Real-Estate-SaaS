import "./globals.css";
import type { Metadata } from "next";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: { default: "ListingForge", template: "%s · ListingForge" },
  description: "Generate and manage booking-ready property listings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-black text-gray-100">
      <body className="min-h-full">
        <NavBar />
        <div className="mx-auto max-w-6xl p-4 lg:p-6">{children}</div>
      </body>
    </html>
  );
}
