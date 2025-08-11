'use client';

import Navbar from '@/components/Navbar';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase as clientSupabase } from '@/lib/supabase';
import ListingForm from '@/components/ListingForm';
import ListingModal from '@/components/ListingModal';
import { useSession } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/navigation';

export default function ClientDashboard() {
  const session = useSession();
  const router = useRouter();

  const [listing, setListing] = useState<string | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // credits state
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState<boolean>(true);

  useEffect(() => {
    if (!session) router.push('/login');
  }, [session, router]);

  const fetchListings = async () => {
    setLoadingListings(true);
    const { data, error } = await clientSupabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching listings:', error.message);
      toast.error('Failed to load listings.');
    } else {
      setListings(data || []);
    }
    setLoadingListings(false);
  };

  const fetchCredits = async () => {
    if (!session?.user) return;
    setLoadingCredits(true);
    const { data, error } = await clientSupabase
      .from('profiles')
      .select('credits')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('❌ Error fetching credits:', error.message);
      toast.error('Failed to load credits.');
      setCredits(null);
    } else {
      setCredits(data?.credits ?? 0);
    }
    setLoadingCredits(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    fetchCredits();
  }, [session]); // refresh when session becomes available

  const handleGenerate = async (formData: any) => {
    if (!session?.user) {
      toast.error('Please log in to generate listings.');
      router.push('/login');
      return;
    }

    // Optional client guard; server enforces credits anyway
    if (credits !== null && credits <= 0) {
      toast.error('You are out of credits. Please upgrade or claim free credits.');
      return;
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error || 'Failed to generate listing.';
      if (response.status === 402) {
        toast.error('Out of credits. Claim free credits or upgrade.');
      } else {
        toast.error(msg);
      }
      return;
    }

    const data = await response.json();
    const { listing: generatedText, saved } = data || {};

    if (!generatedText) {
      setListing('⚠️ No listing generated.');
      toast.error('Failed to generate listing.');
      return;
    }

    // Update UI
    setListing(generatedText);
    if (saved) {
      setListings((prev) => [saved, ...prev]); // instant add
    }

    toast.success('✅ Listing generated & saved!');
    // Sync truth from DB (and credits from server)
    fetchListings();
    fetchCredits();
  };

  const handleDelete = async (id: string) => {
    const { error } = await clientSupabase.from('listings').delete().eq('id', id);
    if (error) {
      console.error('❌ Failed to delete listing:', error.message);
      toast.error('Failed to delete listing.');
    } else {
      setListings((prev) => prev.filter((item) => item.id !== id));
      toast.success('🗑️ Listing deleted');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('📋 Copied to clipboard!');
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen p-8 bg-gray-50">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">🏡 Listing Generator</h1>
          <div className="text-sm">
            {loadingCredits ? (
              <span className="text-gray-500">Credits: …</span>
            ) : credits !== null ? (
              <span className="px-2 py-1 rounded bg-white shadow">Credits: {credits}</span>
            ) : (
              <span className="text-red-500">Credits: unavailable</span>
            )}
          </div>
        </div>

        {credits !== null && credits <= 0 && (
          <div className="mb-6 p-4 rounded-xl bg-white shadow flex items-center justify-between">
            <div>
              <div className="font-semibold">You’re out of credits</div>
              <div className="text-sm text-gray-600">
                Claim 10 free daily credits now and keep creating listings. Paid plans coming soon.
              </div>
            </div>
            <a href="mailto:support@yourapp.com" className="text-blue-600 underline text-sm">
              Contact sales
            </a>
          </div>
        )}

        <ListingForm onGenerate={handleGenerate} credits={credits} fetchCredits={fetchCredits} />

        {listing && (
          <div className="mt-6 p-6 bg-white rounded shadow">
            <h2 className="font-semibold text-lg">Generated Listing</h2>
            <pre className="whitespace-pre-wrap text-gray-700">{listing}</pre>
          </div>
        )}

        <h2 className="text-xl font-semibold mt-10 mb-4">📜 Your Saved Listings</h2>
        {loadingListings ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse p-4 bg-white rounded shadow">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <p className="text-gray-500">No listings yet.</p>
        ) : (
          <div className="space-y-4">
            {listings.map((item) => (
              <div key={item.id} className="p-4 bg-white rounded shadow">
                <h3 className="font-semibold text-blue-600">{item.title}</h3>
                <p className="text-sm text-gray-600">
                  {(item.description || 'No description').slice(0, 100)}...
                </p>
                <div className="mt-2 space-x-4">
                  <button
                    className="text-sm text-blue-500 hover:underline"
                    onClick={() => handleCopy(item.description)}
                  >
                    Copy
                  </button>
                  <button
                    className="text-sm text-green-600 hover:underline"
                    onClick={() => {
                      setSelectedListing(item);
                      setModalOpen(true);
                    }}
                  >
                    View
                  </button>
                  <button
                    className="text-sm text-red-500 hover:underline"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedListing && (
          <ListingModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title={selectedListing.title}
            description={selectedListing.description}
          />
        )}
      </main>
    </>
  );
}
