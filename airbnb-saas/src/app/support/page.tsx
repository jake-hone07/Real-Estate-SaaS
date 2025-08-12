'use client';

import { useState } from 'react';

export default function SupportPage() {
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true); setOk(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/support', {
      method: 'POST',
      body: JSON.stringify({
        email: fd.get('email'),
        subject: fd.get('subject'),
        message: fd.get('message'),
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    const j = await res.json();
    setSending(false);
    setOk(res.ok ? 'Thanks — we’ll get back to you shortly.' : (j?.error || 'Failed to send.'));
    if (res.ok) e.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Support & FAQ</h1>
      <p className="mt-2 text-zinc-600">We usually respond within one business day.</p>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">Contact us</h2>
          <form onSubmit={submit} className="mt-4 grid gap-3">
            <input name="email" required placeholder="you@email.com" className="rounded-xl border px-3 py-2"/>
            <input name="subject" required placeholder="Subject" className="rounded-xl border px-3 py-2"/>
            <textarea name="message" required placeholder="How can we help?" className="min-h-[120px] rounded-xl border px-3 py-2"/>
            <button disabled={sending} className="rounded-xl bg-zinc-900 px-4 py-2 text-white disabled:opacity-60">
              {sending ? 'Sending…' : 'Send'}
            </button>
            {ok && <p className="text-sm text-zinc-600">{ok}</p>}
          </form>
          <p className="mt-3 text-xs text-zinc-500">
            Or email us directly: <a className="text-indigo-600 hover:underline" href="mailto:support@yourbrand.com">support@yourbrand.com</a>
          </p>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">FAQ</h2>
          <ul className="mt-4 space-y-4 text-sm">
            <li>
              <b>What’s included in Premium?</b><br/>
              Unlimited generates, Luxury (Pro) template, full history, and priority support.
            </li>
            <li>
              <b>How do credits work?</b><br/>
              Starter refills 20 credits each billing cycle. Coins add 15 credits per pack.
            </li>
            <li>
              <b>Can I cancel anytime?</b><br/>
              Yes — use “Manage Billing” on your dashboard. You’ll keep access until the end of the period.
            </li>
            <li>
              <b>Is my data private?</b><br/>
              We store only what’s needed to provide the service. See our Privacy Policy for details.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
