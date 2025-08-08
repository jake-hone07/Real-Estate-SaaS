'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();

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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('❌ Failed to get user:', userError?.message);
    throw new Error('User not authenticated.');
  }

  const { error } = await supabase.from('listings').insert([
    {
      ...listing,
      user_id: user.id,
    },
  ]);

  if (error) {
    console.error('❌ Failed to add listing:', error.message);
    throw new Error(error.message);
  }
}
