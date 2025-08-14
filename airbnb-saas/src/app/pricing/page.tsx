export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">Pricing</h1>
        <p className="mt-2 text-gray-600">Start free, then pick a plan that fits your workflow.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-3">
        <Plan
          name="Free"
          price="$0"
          features={[
            '10 credits on signup',
            'Basic generator',
            'Email support',
          ]}
          cta={{ label: 'Get Started', href: '/generate' }}
        />
        <Plan
          name="Starter"
          price="$9.99/mo"
          features={[
            '25 credits / month',
            'Priority queue',
            'Email support',
          ]}
          cta={{ label: 'Choose Starter', href: '/billing' }}
        />
        <Plan
          name="Premium"
          price="$29.99/mo"
          features={[
            'Unlimited*',
            'Fastest queue',
            'Priority support',
          ]}
          cta={{ label: 'Choose Premium', href: '/billing' }}
        />
      </div>

      <p className="mt-6 text-center text-xs text-gray-500">
        *Unlimited within fair-use limits. Usage above automated thresholds may be throttled.
      </p>
    </main>
  );
}

function Plan({
  name, price, features, cta,
}: {
  name: string;
  price: string;
  features: string[];
  cta: { label: string; href: string };
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-lg font-semibold">{name}</div>
      <div className="mb-3 text-sm text-gray-600">{price}</div>
      <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <a
        href={cta.href}
        className="inline-block w-full rounded-lg border px-3 py-2 text-center text-sm hover:bg-gray-50"
      >
        {cta.label}
      </a>
    </div>
  );
}
