export default function Cancel() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Checkout canceled</h1>
      <p className="text-zinc-600 mt-2">No worries—pick a plan anytime.</p>
      <a href="/pricing" className="inline-block mt-6 rounded-xl bg-zinc-900 text-white px-4 py-2">
        Back to Pricing
      </a>
    </div>
  );
}
