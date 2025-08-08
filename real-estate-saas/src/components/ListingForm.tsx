'use client';

import { useState } from 'react';

type FormData = {
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
};

type Props = {
  onGenerate: (formData: FormData) => void;
};

const initialFormState: FormData = {
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
};

export default function ListingForm({ onGenerate }: Props) {
  const [formData, setFormData] = useState<FormData>(initialFormState);

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, type, value } = e.target;

  const isCheckbox = type === 'checkbox';
  const newValue = isCheckbox
    ? (e.target as HTMLInputElement).checked
    : type === 'number'
    ? Number(value)
    : value;

  setFormData((prev) => ({
    ...prev,
    [name]: newValue,
  }));
};


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { name: 'address', placeholder: 'Property Address' },
        { name: 'neighborhood', placeholder: 'Neighborhood' },
        { name: 'bedrooms', type: 'number', placeholder: 'Bedrooms' },
        { name: 'bathrooms', type: 'number', placeholder: 'Bathrooms' },
        { name: 'squareFeet', type: 'number', placeholder: 'Square Feet' },
        { name: 'interiorStyle', placeholder: 'Interior Style (e.g. Modern, Rustic)' },
        { name: 'renovations', placeholder: 'Recent Renovations' },
        { name: 'outdoorFeatures', placeholder: 'Outdoor Features (e.g. hot tub, patio)' },
        { name: 'amenitiesNearby', placeholder: 'Nearby Amenities (e.g. restaurants, trails)' },
        { name: 'hoaInfo', placeholder: 'HOA Information (optional)' },
      ].map((input) => (
        <input
          key={input.name}
          className="w-full p-2 border rounded"
          name={input.name}
          type={input.type ?? 'text'}
          value={(formData as any)[input.name]}
          onChange={handleChange}
          placeholder={input.placeholder}
        />
      ))}

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
