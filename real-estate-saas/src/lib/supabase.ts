import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon);

export type NewListing = {
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
};

export async function addListing(listing: NewListing) {
  const { error } = await supabase.from('listings').insert([listing]);

  if (error) {
    console.error('❌ Failed to add listing:', error.message);
    throw new Error(error.message);
  }
}
