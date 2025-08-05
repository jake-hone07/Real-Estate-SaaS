'use client';

import { useState } from 'react';

export default function ListingForm() {
  const [formData, setFormData] = useState({
    address: '',
    beds: '',
    baths: '',
    sqft: '',
    features: '',
    tone: 'Formal',
    spanish: false,
  });

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value, type } = e.target;

  const newValue =
    type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : value;

  setFormData((prev) => ({
    ...prev,
    [name]: newValue,
  }));
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-md">
      <input name="address" placeholder="Property Address" value={formData.address} onChange={handleChange} className="w-full border p-2 rounded" />
      <input name="beds" placeholder="Bedrooms" value={formData.beds} onChange={handleChange} className="w-full border p-2 rounded" />
      <input name="baths" placeholder="Bathrooms" value={formData.baths} onChange={handleChange} className="w-full border p-2 rounded" />
      <input name="sqft" placeholder="Square Feet" value={formData.sqft} onChange={handleChange} className="w-full border p-2 rounded" />
      <textarea name="features" placeholder="Key Features" value={formData.features} onChange={handleChange} className="w-full border p-2 rounded" />
      
      <select name="tone" value={formData.tone} onChange={handleChange} className="w-full border p-2 rounded">
        <option value="Formal">Formal</option>
        <option value="Casual">Casual</option>
        <option value="Luxury">Luxury</option>
      </select>

      <label className="flex items-center space-x-2">
        <input type="checkbox" name="spanish" checked={formData.spanish} onChange={handleChange} />
        <span>Include Spanish translation</span>
      </label>

      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Generate Listing</button>
    </form>
  );
}
