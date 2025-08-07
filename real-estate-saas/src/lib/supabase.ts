import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon);
const { data } = await supabase.from('listings').select('*').order('created_at', { ascending: false });

// ✅ Move this after supabase is declared
supabase.from('listings').select('*').then(console.log);

export async function addListing(listing: {
  title: string;
  description: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  features: string;
  tone: string;
  translate: boolean;
  neighborhood?: string;
  interiorStyle?: string;
  renovations?: string;
  outdoorFeatures?: string;
  nearbyAmenities?: string;
  hoaInfo?: string;
}) {
  const { error } = await supabase.from('listings').insert([
    {
      ...listing,
      squareFeet: listing.squareFeet, // or use `sqft` consistently
    },
  ]);

  if (error) throw new Error(error.message);
}

