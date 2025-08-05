'use client';
import { useState } from 'react';
import ListingForm from '@/components/ListingForm';

export default function DashboardPage() {
  const [listing, setListing] = useState('');

 const handleGenerate = async (formData: any) => {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData), // comes from <ListingForm onGenerate={handleGenerate} />
  });

  const data = await response.json();

  setListing(`🏡 ${data.listing}`);
};


  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Listing Generator</h1>
      <ListingForm onGenerate={handleGenerate} />
      {listing && (
        <div className="mt-6 p-4 bg-white border rounded shadow">
          <p className="text-gray-700 font-semibold mb-2">Generated Listing</p>
          <p>{listing}</p>
        </div>
      )}
    </main>
  );
}


