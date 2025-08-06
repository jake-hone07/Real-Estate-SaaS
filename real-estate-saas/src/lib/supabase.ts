import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon);
export const addListing = async (listing: {
  title: string
  description: string
  address: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  features: string
  tone: string
  translate: boolean
}) => {

  const { data, error } = await supabase.from('Listings').insert([listing])
  if (error) throw new Error(error.message)
  return data
}
