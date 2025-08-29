// src/app/listing/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ListingIndex() {
  // This route isn't used; send people to My Listings
  redirect('/app/my-listings');
}
