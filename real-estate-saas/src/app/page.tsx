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
  translate: false,
  neighborhood: "",
  interiorStyle: "",
  renovations: "",
  outdoorFeatures: "",
  nearbyAmenities: "",
  hoaInfo: "",
});



  const [generatedListing, setGeneratedListing] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, type, value } = e.target;
  const isCheckbox = type === "checkbox";
  const inputValue = isCheckbox && "checked" in e.target ? e.target.checked : value;

  setForm((prev) => ({
    ...prev,
    [name]: inputValue,
  }));
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
console.log("Response from /api/generate", response);

      const data = await response.json()
console.log("Parsed JSON data", data);
console.log("Sending to Supabase", {
  ...form,
  description: data.listing,
});

      if (!response.ok) throw new Error(data.error || 'Something went wrong.')

      setGeneratedListing(data.listing)

      await addListing({
  title: form.address,
  description: data.listing,
  address: form.address,
  price: Number(form.price),
  bedrooms: Number(form.bedrooms),
  bathrooms: Number(form.bathrooms),
  sqft: Number(form.sqft),
  features: form.features,
  tone: form.tone,
  translate: form.translate,
  neighborhood: form.neighborhood,
interiorStyle: form.interiorStyle,
renovations: form.renovations,
outdoorFeatures: form.outdoorFeatures,
nearbyAmenities: form.nearbyAmenities,
hoaInfo: form.hoaInfo,
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
  <input
  type="text"
  name="neighborhood"
  value={form.neighborhood}
  onChange={handleChange}
  placeholder="Neighborhood"
  className="w-full p-3 border rounded"
/>
<input
  type="text"
  name="interiorStyle"
  value={form.interiorStyle}
  onChange={handleChange}
  placeholder="Interior Style"
  className="w-full p-3 border rounded"
/>
<input
  type="text"
  name="renovations"
  value={form.renovations}
  onChange={handleChange}
  placeholder="Recent Renovations"
  className="w-full p-3 border rounded"
/>
<input
  type="text"
  name="outdoorFeatures"
  value={form.outdoorFeatures}
  onChange={handleChange}
  placeholder="Outdoor Features"
  className="w-full p-3 border rounded"
/>
<input
  type="text"
  name="nearbyAmenities"
  value={form.nearbyAmenities}
  onChange={handleChange}
  placeholder="Nearby Amenities"
  className="w-full p-3 border rounded"
/>
<input
  type="text"
  name="hoaInfo"
  value={form.hoaInfo}
  onChange={handleChange}
  placeholder="HOA Info (optional)"
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
  <div className="flex items-center gap-2">
  <input
    type="checkbox"
    name="translate"
    checked={form.translate}
    onChange={handleChange}
  />
  <label htmlFor="translate">Include Spanish translation</label>
</div>

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
