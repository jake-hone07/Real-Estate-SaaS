export default function Success() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold">You’re in 🎉</h1>
      <p className="text-zinc-600 mt-2">Your plan is active. Head to your dashboard to start generating.</p>
      <a href="/dashboard" className="inline-block mt-6 rounded-xl bg-zinc-900 text-white px-4 py-2">
        Go to Dashboard
      </a>
    </div>
  );
}
