export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-zinc-600">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="prose mt-6">
        <p>By using the service you agree to these terms.</p>
        <h3>Subscriptions</h3>
        <p>Subscriptions renew automatically until canceled. You can cancel anytime via the Billing Portal.</p>
        <h3>Acceptable Use</h3>
        <p>No illegal content or misuse. We may suspend accounts for abuse.</p>
        <h3>Liability</h3>
        <p>Service is provided “as is.” We are not liable for indirect or consequential damages.</p>
      </div>
    </div>
  );
}
