import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';
import AppHeader from '@/components/AppHeader';

export const metadata: Metadata = {
  title: 'Your App',
  description: 'AI that turns property facts into market-ready listings.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 antialiased">
        <Providers>
          <AppHeader />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
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
