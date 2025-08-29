// src/app/listing/page.tsx
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ListingIndex() {
  // We don't use /listing as an index; send people to My Listings
  redirect('/app/my-listings');
}
