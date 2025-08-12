export default function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-zinc-600">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="prose mt-6">
        <p>We collect account information and content you generate to provide the service. We do not sell your data.</p>
        <h3>Data we collect</h3>
        <ul>
          <li>Account data (email, subscription status)</li>
          <li>Listings you generate</li>
          <li>Payment data handled by Stripe</li>
        </ul>
        <h3>How we use data</h3>
        <ul>
          <li>Operate and improve the product</li>
          <li>Provide support</li>
          <li>Detect abuse</li>
        </ul>
        <p>Questions? Email <a href="mailto:support@yourbrand.com">support@yourbrand.com</a>.</p>
      </div>
    </div>
  );
}
