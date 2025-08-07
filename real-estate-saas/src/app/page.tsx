'use client'

import { useState } from 'react'
import { addListing } from '@/lib/supabase'
import RecentListings from '@/components/RecentListings';


export default function Home() {
 const [form, setForm] = useState({
  address: "",
  bedrooms: "",
  bathrooms: "",
  squareFeet: "",
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
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
  squareFeet: Number(form.squareFeet),
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
      <h1 className="text-2xl font-bold mb-6">AirB&B Description Generator</h1>
      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-xl">

  {/* Property Details */}
  <fieldset className="border p-4 rounded">
    <legend className="text-lg font-semibold">🏠 Property Details</legend>

    <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Address" className="w-full p-3 mt-3 border rounded" />

    <div className="grid grid-cols-3 gap-4 mt-4">
      <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} placeholder="Bedrooms" className="p-3 border rounded" />
      <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} placeholder="Bathrooms" className="p-3 border rounded" />
      <input type="number" name="squareFeet" value={form.squareFeet} onChange={handleChange} placeholder="Square Feet" className="p-3 border rounded" />
    </div>

    <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="Price (USD)" className="w-full p-3 mt-4 border rounded" />
  </fieldset>

  {/* Style & Features */}
  <fieldset className="border p-4 rounded">
    <legend className="text-lg font-semibold">🎨 Style & Features</legend>

   <div className="mt-3">
  <textarea
    name="features"
    value={form.features}
    onChange={handleChange}
    placeholder="Special Features (e.g. pool, large yard)"
    rows={3}
    className="w-full p-3 border rounded resize-none"
  />
  <div className="text-sm text-gray-500 flex justify-between mt-1">
    <span>{form.features.trim().split(/\s+/).filter(Boolean).length} words</span>
    <span>{form.features.length} chars</span>
  </div>
</div>

    <div className="mt-3">
  <textarea
    name="interiorStyle"
    value={form.interiorStyle}
    onChange={handleChange}
    placeholder="Interior Style (e.g. modern farmhouse)"
    rows={2}
    className="w-full p-3 border rounded resize-none"
  />
  <div className="text-sm text-gray-500 flex justify-between mt-1">
    <span>{form.interiorStyle.trim().split(/\s+/).filter(Boolean).length} words</span>
    <span>{form.interiorStyle.length} chars</span>
  </div>
</div>

    <div className="mt-3">
  <textarea
    name="renovations"
    value={form.renovations}
    onChange={handleChange}
    placeholder="Recent Renovations (if any)"
    rows={2}
    className="w-full p-3 border rounded resize-none"
  />
  <div className="text-sm text-gray-500 flex justify-between mt-1">
    <span>{form.renovations.trim().split(/\s+/).filter(Boolean).length} words</span>
    <span>{form.renovations.length} chars</span>
  </div>
</div>

    <div className="mt-3">
  <textarea
    name="outdoorFeatures"
    value={form.outdoorFeatures}
    onChange={handleChange}
    placeholder="Outdoor Features (e.g. deck, firepit)"
    rows={2}
    className="w-full p-3 border rounded resize-none"
  />
  <div className="text-sm text-gray-500 flex justify-between mt-1">
    <span>{form.outdoorFeatures.trim().split(/\s+/).filter(Boolean).length} words</span>
    <span>{form.outdoorFeatures.length} chars</span>
  </div>
</div>

  </fieldset>

  {/* Location */}
  <fieldset className="border p-4 rounded">
    <legend className="text-lg font-semibold">📍 Location & Amenities</legend>

    <div className="mt-3">
  <textarea
    name="neighborhood"
    value={form.neighborhood}
    onChange={handleChange}
    placeholder="Neighborhood Name"
    rows={2}
    className="w-full p-3 border rounded resize-none"
  />
  <div className="text-sm text-gray-500 flex justify-between mt-1">
    <span>{form.neighborhood.trim().split(/\s+/).filter(Boolean).length} words</span>
    <span>{form.neighborhood.length} chars</span>
  </div>
</div>

    <div className="mt-3">
  <textarea
    name="nearbyAmenities"
    value={form.nearbyAmenities}
    onChange={handleChange}
    placeholder="Nearby Amenities (e.g. beach, golf course)"
    rows={2}
    className="w-full p-3 border rounded resize-none"
  />
  <div className="text-sm text-gray-500 flex justify-between mt-1">
    <span>{form.nearbyAmenities.trim().split(/\s+/).filter(Boolean).length} words</span>
    <span>{form.nearbyAmenities.length} chars</span>
  </div>
</div>

    <div className="mt-3">
  <textarea
    name="hoaInfo"
    value={form.hoaInfo}
    onChange={handleChange}
    placeholder="HOA Info (optional)"
    rows={2}
    className="w-full p-3 border rounded resize-none"
  />
  <div className="text-sm text-gray-500 flex justify-between mt-1">
    <span>{form.hoaInfo.trim().split(/\s+/).filter(Boolean).length} words</span>
    <span>{form.hoaInfo.length} chars</span>
  </div>
</div>

  </fieldset>

  {/* Preferences */}
  <fieldset className="border p-4 rounded">
    <legend className="text-lg font-semibold">📝 Listing Preferences</legend>

    <select name="tone" value={form.tone} onChange={handleChange} className="w-full p-3 mt-3 border rounded">
      <option value="">Select Tone</option>
      <option value="Formal">Formal</option>
      <option value="Casual">Casual</option>
      <option value="Luxury">Luxury</option>
      <option value="Playful">Playful</option>
    </select>

    <label className="flex items-center space-x-2 mt-4">
      <input type="checkbox" name="translate" checked={form.translate} onChange={handleChange} />
      <span>Include Spanish translation</span>
    </label>
  </fieldset>

  <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full mt-4">
    {loading ? "Generating..." : "Generate Listing"}
  </button>
</form>




      {error && <p className="text-red-600 mt-4">{error}</p>}
{generatedListing && (
  <div className="mt-6 p-6 bg-white border rounded-xl shadow-lg space-y-6">
    <h2 className="text-xl font-semibold text-gray-800 text-center">🏠 Generated Listing</h2>

    {/* Title */}
    <h3 className="text-2xl font-bold text-center text-blue-700">
      {generatedListing.split("\n")[0]}
    </h3>

    {/* Body */}
    <div className="text-gray-700 whitespace-pre-line font-mono leading-relaxed tracking-wide">
      {generatedListing.split("\n").slice(1).join("\n")}
    </div>

    {/* Copy Button */}
    <div className="text-center">
      <button
        onClick={() => {
          navigator.clipboard.writeText(generatedListing);
          alert("✅ Copied to clipboard!");
        }}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        📋 Copy to Clipboard
      </button>
    </div>
  </div>
)}
<RecentListings />



    </main>
  )
}
