'use client';

import AccountStatus from './AccountStatus';

export default function AppHeader() {
  return (
    <header className="h-16 px-4 flex items-center justify-between border-b border-neutral-800">
      <a href="/" className="font-semibold">ListingForge</a>
      <nav className="flex items-center gap-4">
        <a href="/generate">Generate</a>
        <a href="/billing">Billing</a>
        <a href="/login">Login</a>
        <AccountStatus />
      </nav>
    </header>
  );
}
