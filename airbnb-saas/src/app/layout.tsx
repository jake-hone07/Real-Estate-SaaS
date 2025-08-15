// src/app/layout.tsx
import './globals.css';
import { Suspense } from 'react';
import AppHeader from '@/components/AppHeader';
import Providers from './providers';

export const metadata = {
  title: 'ListingForge',
  description: 'Turn property facts into market-ready listings.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text antialiased">
        <Providers>
          <Suspense fallback={null}>
            <AppHeader />
          </Suspense>
          <div className="min-h-[calc(100vh-64px)]">{children}</div>
        </Providers>
      </body>
    </html>
  );
}

