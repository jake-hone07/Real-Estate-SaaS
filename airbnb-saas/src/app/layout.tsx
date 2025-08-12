import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your App',
  description: 'AI that turns property facts into market-ready listings.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="/" className="text-lg font-semibold">🏠 YourBrand</a>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/pricing" className="hover:underline">Pricing</a>
          <a href="/generate" className="hover:underline">Generate</a>
          <a href="/support" className="hover:underline">Support</a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-zinc-600">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} YourBrand</div>
          <div className="flex items-center gap-4">
            <a href="/support" className="hover:underline">Support</a>
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/terms" className="hover:underline">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
