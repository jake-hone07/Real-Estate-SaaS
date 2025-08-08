'use client';

import './globals.css';
import { useState } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());

  return (
    <html lang="en">
      <body className="bg-gray-100 text-black">
        <SessionContextProvider supabaseClient={supabaseClient}>
          <Toaster position="top-right" />
          <Navbar />
          <main className="max-w-5xl mx-auto px-4">{children}</main>
        </SessionContextProvider>
      </body>
    </html>
  );
}

