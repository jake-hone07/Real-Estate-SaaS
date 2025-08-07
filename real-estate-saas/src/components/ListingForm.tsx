'use client';
import { useState } from 'react';
import { addListing } from '@/lib/supabase';

type Props = {
  onGenerate: (formData: {
    address: string;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    features: string;
    tone: string;
    translate: boolean;
    neighborhood: string;
    interiorStyle: string;
    renovations: string;
    outdoorFeatures: string;
    amenitiesNearby: string;
    hoaInfo: string;
  }) => void;
};

export default function ListingForm({ onGenerate }: Props) {
  const [formData, setFormData] = useState({
    address: '',
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 800,
    features: '',
    tone: 'Casual',
    translate: false,
    neighborhood: '',
    interiorStyle: '',
    renovations: '',
    outdoorFeatures: '',
    amenitiesNearby: '',
    hoaInfo: '',
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
        name="neighborhood"
        value={formData.neighborhood}
        onChange={handleChange}
        placeholder="Neighborhood"
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
      <input
        className="w-full p-2 border rounded"
        name="interiorStyle"
        value={formData.interiorStyle}
        onChange={handleChange}
        placeholder="Interior Style (e.g. Modern, Rustic)"
      />
      <input
        className="w-full p-2 border rounded"
        name="renovations"
        value={formData.renovations}
        onChange={handleChange}
        placeholder="Recent Renovations"
      />
      <input
        className="w-full p-2 border rounded"
        name="outdoorFeatures"
        value={formData.outdoorFeatures}
        onChange={handleChange}
        placeholder="Outdoor Features (e.g. hot tub, patio)"
      />
      <input
        className="w-full p-2 border rounded"
        name="amenitiesNearby"
        value={formData.amenitiesNearby}
        onChange={handleChange}
        placeholder="Nearby Amenities (e.g. restaurants, trails)"
      />
      <input
        className="w-full p-2 border rounded"
        name="hoaInfo"
        value={formData.hoaInfo}
        onChange={handleChange}
        placeholder="HOA Information (optional)"
      />
      <textarea
        className="w-full p-2 border rounded"
        name="features"
        value={formData.features}
        onChange={handleChange}
        placeholder="Special Features or Notes"
      />
      <select
        name="tone"
        className="w-full p-2 border rounded"
        value={formData.tone}
        onChange={handleChange}
      >
        <option value="Casual">Casual</option>
        <option value="Exciting">Exciting</option>
        <option value="Family-Friendly">Family-Friendly</option>
        <option value="Luxury">Luxury</option>
        <option value="Romantic">Romantic</option>
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
