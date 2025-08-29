import { cookies } from 'next/headers';
import {
  createBrowserClient,
  createServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import type { PostgrestError } from '@supabase/supabase-js';

export const createClientBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// ⬇️ NOW ASYNC
export const createClientServer = async () => {
  const cookieStore = await cookies(); // Next 15: async cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options }); // object form
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

// ---- helpers
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

export async function getUserServer() {
  const supabase = await createClientServer(); // ⬅️ await
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error };
}

export async function addListing(listing: NewListing) {
  const supabase = createClientBrowser();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) throw new Error('User not authenticated.');

  const { error }: { error: PostgrestError | null } = await supabase
    .from('listings')
    .insert([{ ...listing, user_id: user.id }]);

  if (error) throw new Error(error.message);
}
