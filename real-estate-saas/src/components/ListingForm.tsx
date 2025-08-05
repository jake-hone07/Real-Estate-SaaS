'use client';
import { useState } from 'react';

type Props = {
  onGenerate: (formData: {
    address: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    features: string;
    tone: string;
    translate: boolean;
  }) => void;
};

export default function ListingForm({ onGenerate }: Props) {
  const [formData, setFormData] = useState({
    address: '',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1500,
    features: '',
    tone: 'Formal',
    translate: false,
  });

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const target = e.target;
  const { name, type, value } = target;

  setFormData((prev) => ({
    ...prev,
    [name]: type === 'checkbox' && 'checked' in target ? (target as HTMLInputElement).checked : value,
  }));
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        className="w-full p-2 border rounded"
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Property Address"
      />
      <input
        className="w-full p-2 border rounded"
        name="bedrooms"
        type="number"
        value={formData.bedrooms}
        onChange={handleChange}
        placeholder="Bedrooms"
      />
      <input
        className="w-full p-2 border rounded"
        name="bathrooms"
        type="number"
        value={formData.bathrooms}
        onChange={handleChange}
        placeholder="Bathrooms"
      />
      <input
        className="w-full p-2 border rounded"
        name="squareFeet"
        type="number"
        value={formData.squareFeet}
        onChange={handleChange}
        placeholder="Square Feet"
      />
      <textarea
        className="w-full p-2 border rounded"
        name="features"
        value={formData.features}
        onChange={handleChange}
        placeholder="Key Features"
      />
      <select
        name="tone"
        className="w-full p-2 border rounded"
        value={formData.tone}
        onChange={handleChange}
      >
        <option value="Formal">Formal</option>
        <option value="Casual">Casual</option>
        <option value="Luxury">Luxury</option>
      </select>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="translate"
          checked={formData.translate}
          onChange={handleChange}
        />
        <span>Include Spanish translation</span>
      </label>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Generate Listing
      </button>
    </form>
  );
}
