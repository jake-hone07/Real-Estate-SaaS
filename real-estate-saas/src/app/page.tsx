'use client'

import { useState } from 'react'
import { addListing } from '@/lib/supabase'

export default function Home() {
  const [form, setForm] = useState({ prompt: '' })
  const [generatedListing, setGeneratedListing] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

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
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="prompt"
          value={form.prompt}
          onChange={handleChange}
          placeholder="Describe the property..."
          className="w-full p-3 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Generating...' : 'Generate Listing'}
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
