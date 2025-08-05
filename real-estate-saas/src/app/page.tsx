'use client'

import { useState } from 'react'
import { addListing } from '@/lib/supabase'

export default function Home() {
  const [form, setForm] = useState({
  address: "",
  bedrooms: "",
  bathrooms: "",
  sqft: "",
  price: "",
  features: "",
  tone: "",
});

  const [generatedListing, setGeneratedListing] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;
  setForm((prev) => ({ ...prev, [name]: value }));
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setGeneratedListing('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Something went wrong.')

      setGeneratedListing(data.result)

      await addListing({
  title: 'Generated Listing',
  description: data.result,
  address: '123 Main St',
  price: 500000,
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
})

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Real Estate Listing Generator</h1>
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-xl">
  <input
    type="text"
    name="address"
    value={form.address}
    onChange={handleChange}
    placeholder="Address"
    className="w-full p-3 border rounded"
  />
  <input
    type="number"
    name="bedrooms"
    value={form.bedrooms}
    onChange={handleChange}
    placeholder="Bedrooms"
    className="w-full p-3 border rounded"
  />
  <input
    type="number"
    name="bathrooms"
    value={form.bathrooms}
    onChange={handleChange}
    placeholder="Bathrooms"
    className="w-full p-3 border rounded"
  />
  <input
    type="number"
    name="sqft"
    value={form.sqft}
    onChange={handleChange}
    placeholder="Square Feet"
    className="w-full p-3 border rounded"
  />
  <input
    type="number"
    name="price"
    value={form.price}
    onChange={handleChange}
    placeholder="Price"
    className="w-full p-3 border rounded"
  />
  <input
    type="text"
    name="features"
    value={form.features}
    onChange={handleChange}
    placeholder="Extra Features (e.g. pool, large yard)"
    className="w-full p-3 border rounded"
  />
  <select
    name="tone"
    value={form.tone}
    onChange={handleChange}
    className="w-full p-3 border rounded"
  >
    <option value="">Select tone</option>
    <option value="Formal">Formal</option>
    <option value="Casual">Casual</option>
    <option value="Luxury">Luxury</option>
    <option value="Playful">Playful</option>
  </select>
  <button
    type="submit"
    disabled={loading}
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
  >
    {loading ? "Generating..." : "Generate Listing"}
  </button>
</form>


      {error && <p className="text-red-600 mt-4">{error}</p>}
      {generatedListing && (
        <div className="mt-6 p-4 bg-gray-100 border rounded">
          <h2 className="text-lg font-semibold mb-2">Generated Listing:</h2>
          <p>{generatedListing}</p>
        </div>
      )}
    </main>
  )
}
