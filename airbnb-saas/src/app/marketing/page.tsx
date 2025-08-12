// app/(marketing)/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Listing AI — Turn property facts into market-ready listings',
  description:
    'Generate polished, facts-only real-estate listings from a short form. No fluff, no hallucinations. Try it free.',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="px-6 md:px-10 py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Turn property facts into <span className="text-blue-600">market-ready listings</span>.
            </h1>
            <p className="mt-4 text-gray-600">
              Paste the basics—address, beds/baths, style, amenities—and get a clean,
              buyer-ready description in seconds. Strictly facts-only. No made-up features.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700"
              >
                Try free (10 daily credits)
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg border"
              >
                See pricing
              </Link>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              No card required for the free tier.
            </p>
          </div>

          {/* Sample Output Card */}
          <div className="bg-white rounded-2xl shadow p-6 border">
            <div className="text-sm text-gray-500 mb-2">Sample output</div>
            <h3 className="font-semibold text-lg">**Overview**</h3>
            <p className="text-gray-700 mt-2">
              Welcome to your contemporary farmhouse retreat in Oakwood Estates. This
              3-bed, 2-bath home blends warm, modern finishes with a spacious open plan—
              perfect for everyday comfort and easy entertaining. A 2022 kitchen refresh
              adds energy-efficient appliances and crisp, functional design.
            </p>
            <p className="text-gray-700 mt-3">
              Step outside to a fenced backyard and covered patio—great for casual hangs
              or quiet mornings. With a community park, walking trails, and a local
              farmers market nearby, daily living feels convenient and connected.
            </p>

            <h3 className="font-semibold text-lg mt-6">**Highlights**</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-1 mt-2">
              <li>3 beds • 2 baths • ~1750 sq ft</li>
              <li>Contemporary farmhouse interior style</li>
              <li>Renovated kitchen (2022), energy-efficient appliances</li>
              <li>Fenced backyard with covered patio</li>
              <li>Near park, trails, and farmers market</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 md:px-10 py-14">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <Benefit
            title="Facts-only engine"
            body="Our prompt & sanitizer enforce your inputs—no invented amenities or fluff."
          />
          <Benefit
            title="Ready in seconds"
            body="Clean structure with Overview, Highlights, and Details—easy to paste anywhere."
          />
          <Benefit
            title="Built for teams"
            body="Save, copy, and revisit listings. Simple credit system and daily free tier."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-10 pb-20">
        <div className="max-w-6xl mx-auto bg-white border rounded-2xl p-8 md:p-10 flex items-center justify-between gap-6 shadow-sm">
          <div>
            <h3 className="text-xl md:text-2xl font-semibold">Start generating in under a minute</h3>
            <p className="text-gray-600 mt-1">Sign up, enter the basics, and ship a listing today.</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700"
          >
            Get started free
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Benefit({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <h4 className="font-semibold">{title}</h4>
      <p className="text-gray-600 mt-2">{body}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t py-10 text-center text-sm text-gray-500">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-center gap-6 mb-3">
          <a className="hover:underline" href="/pricing">Pricing</a>
          <a className="hover:underline" href="/privacy">Privacy</a>
          <a className="hover:underline" href="/terms">Terms</a>
        </div>
        <div>© {new Date().getFullYear()} Listing AI</div>
      </div>
    </footer>
  );
}
