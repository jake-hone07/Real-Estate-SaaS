export const metadata = {
  title: "Home",
};

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome to ListingForge</h1>
      <p className="mt-2 max-w-2xl text-gray-400">
        Turn your property facts into a booking-ready listing, then save and manage it in one place.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="/generate"
          className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black"
        >
          Generate a listing
        </a>
        <a
          href="/my-listings"
          className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm"
        >
          View my listings
        </a>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-800 p-5">
          <h3 className="font-medium">Fast, structured output</h3>
          <p className="mt-1 text-sm text-gray-400">
            Titles, summary, highlights, sections, amenities, captions, SEO — all ready to paste.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-800 p-5">
          <h3 className="font-medium">Save & manage</h3>
          <p className="mt-1 text-sm text-gray-400">
            Save generated results to your account and view the full listing later.
          </p>
        </div>
      </div>
    </main>
  );
}
