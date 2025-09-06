"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Types that match the `public.listings` table.
 * Assumes columns: id (uuid), user_id (uuid), title (text),
 * description (text), price (numeric nullable), created_at, updated_at, content (jsonb).
 */
type Listing = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number | null;
  created_at: string;
  updated_at: string;
  content: any | null; // structured JSON saved from /generate
};

function fmtDate(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function Chip({ children }: { children: string }) {
  return (
    <span className="rounded border border-gray-700 px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

/** Extract a labeled block from the "facts" blob saved by /generate */
function extractFactsSection(facts: string, header: string) {
  if (!facts) return "";
  // Matches e.g., "BASICS:\n...<until next double newline + ALLCAPS header or end>"
  const re = new RegExp(
    `${header}:\\s*([\\s\\S]*?)(?:\\n\\n[A-Z][A-Z\\s]+:|$)`,
    "i"
  );
  const m = facts.match(re);
  return m ? m[1].trim() : "";
}

/** Build the generator's autosave payload from a listing */
function buildGeneratorAutosaveFromListing(l: Listing) {
  const c = l.content || {};
  const facts: string = c.facts || ""; // saved by GenerateClient.buildContentJSON()
  const payload = {
    basics: extractFactsSection(facts, "BASICS"),
    highlightsIn: extractFactsSection(facts, "HIGHLIGHTS"),
    locationIn: extractFactsSection(facts, "LOCATION"),
    rulesIn: extractFactsSection(facts, "HOUSE RULES"),
    // Prefer original options if present; GenerateClient merges defaults on load.
    opt: c.options || undefined,
    projectName: l.title || "Untitled listing",
  };
  return payload;
}

export default function MyListingsPage() {
  const router = useRouter();

  // Session (no redirect here; middleware guards this route)
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Data & UI state
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Inline composer (create/edit)
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState({ id: "", title: "", description: "", price: "" });

  // “View full” modal state
  const [viewItem, setViewItem] = useState<Listing | null>(null);

  /** ---------- Session ---------- */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setSessionChecked(true);
    })();
  }, []);

  /** ---------- Load Listings ---------- */
  useEffect(() => {
    if (!sessionChecked) return;
    (async () => {
      await loadListings();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionChecked]);

  async function loadListings() {
    setError(null);
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setListings((data || []) as Listing[]);
  }

  /** ---------- CRUD ---------- */
  function openNew() {
    setForm({ id: "", title: "", description: "", price: "" });
    setShowComposer(true);
  }
  function openEdit(l: Listing) {
    setForm({
      id: l.id,
      title: l.title ?? "",
      description: l.description ?? "",
      price: l.price?.toString() ?? "",
    });
    setShowComposer(true);
  }

  const formValid = useMemo(() => form.title.trim().length > 0, [form.title]);

  async function saveListing() {
    setError(null);
    if (!formValid) {
      setError("Title is required.");
      return;
    }
    if (form.price && isNaN(Number(form.price))) {
      setError("Price must be a number.");
      return;
    }

    if (form.id) {
      const { error } = await supabase
        .from("listings")
        .update({
          title: form.title.trim(),
          description: form.description ? form.description.trim() : null,
          price: form.price ? Number(form.price) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", form.id);
      if (error) return setError(error.message);
    } else {
      const { error } = await supabase.from("listings").insert([
        {
          user_id: userId,
          title: form.title.trim(),
          description: form.description ? form.description.trim() : null,
          price: form.price ? Number(form.price) : null,
          content: null,
        },
      ]);
      if (error) return setError(error.message);
    }

    setShowComposer(false);
    await loadListings();
  }

  async function deleteListing(id: string) {
    if (!confirm("Delete this listing?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) return alert(error.message);
    await loadListings();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  /** ---------- Edit in Generator ---------- */
  function editInGenerator(l: Listing) {
    try {
      const autosave = buildGeneratorAutosaveFromListing(l);
      localStorage.setItem("lg_project_v2", JSON.stringify(autosave));
    } catch {
      // ignore
    }
    router.push("/generate");
  }

  /** ---------- UI ---------- */
  if (!sessionChecked) return <div className="p-6">Checking session…</div>;
  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Listings</h1>
          <p className="mt-1 text-sm text-gray-400">
            Generate new listings on{" "}
            <button
              onClick={() => router.push("/generate")}
              className="underline hover:text-gray-300"
            >
              Generate
            </button>
            , or create one manually. Click <em>Edit in Generator</em> to iterate on a saved draft.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openNew}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black"
          >
            New
          </button>
          <button
            onClick={signOut}
            className="rounded-xl border border-gray-700 px-3 py-2 text-sm"
          >
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-red-700">{error}</div>
      )}

      {/* Empty state */}
      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-800 p-10 text-center text-gray-400">
          You don’t have any listings yet. Click <span className="text-gray-200">New</span> or save one from{" "}
          <button onClick={() => router.push("/generate")} className="underline">
            Generate
          </button>
          .
        </div>
      ) : (
        <ul className="space-y-4">
          {listings.map((l) => (
            <li key={l.id} className="rounded-2xl border border-gray-800 bg-black/40">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Left: title/summary snippet */}
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">{fmtDate(l.created_at)}</div>
                  <h2 className="mt-0.5 truncate text-base font-medium">{l.title}</h2>

                  {/* Show summary snippet from content JSON if available, else description */}
                  {l.content?.summary ? (
                    <p className="mt-1 line-clamp-3 text-sm text-gray-300">
                      {String(l.content.summary)}
                    </p>
                  ) : l.description ? (
                    <p className="mt-1 line-clamp-3 text-sm text-gray-300">{l.description}</p>
                  ) : null}

                  {/* chips (amenities/highlights small subset) */}
                  {!!(l.content?.amenities?.length || l.content?.highlights?.length) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(l.content?.amenities ?? []).slice(0, 6).map((a: string) => (
                        <Chip key={`a-${a}`}>{a}</Chip>
                      ))}
                      {(l.content?.highlights ?? []).slice(0, 6).map((h: string) => (
                        <Chip key={`h-${h}`}>{h}</Chip>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: actions */}
                <div className="shrink-0 space-x-2">
                  <button
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm"
                    onClick={() => setViewItem(l)}
                  >
                    View
                  </button>
                  <button
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm"
                    onClick={() => openEdit(l)}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm"
                    onClick={() => editInGenerator(l)}
                  >
                    Edit in Generator
                  </button>
                  <button
                    className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm"
                    onClick={() => deleteListing(l.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Composer (Create/Edit) */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-5 text-gray-900 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold">
                {form.id ? "Edit Listing" : "New Listing"}
              </h3>
              <button
                className="rounded-md border px-2 py-1 text-sm"
                onClick={() => setShowComposer(false)}
              >
                Close
              </button>
            </div>

            <label className="block text-sm">
              <span className="text-gray-700">Title</span>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Modern Condo with Mountain Views"
              />
            </label>

            <label className="block text-sm">
              <span className="text-gray-700">Description (optional)</span>
              <textarea
                className="mt-1 min-h-[120px] w-full rounded-lg border p-2"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Freeform text or notes"
              />
            </label>

            <label className="block text-sm">
              <span className="text-gray-700">Price (optional)</span>
              <input
                className="mt-1 w-full rounded-lg border p-2"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                inputMode="decimal"
                placeholder="e.g., 150"
              />
            </label>

            {!formValid && (
              <div className="text-sm text-red-600">Title is required.</div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                className="rounded-lg border px-3 py-2"
                onClick={() => setShowComposer(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-black px-3 py-2 text-white"
                onClick={saveListing}
              >
                {form.id ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full structured “View” modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-5xl space-y-5 rounded-2xl border border-gray-800 bg-black p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500">{fmtDate(viewItem.created_at)}</div>
                <h3 className="mt-1 text-xl font-semibold">{viewItem.title}</h3>
              </div>
              <div className="space-x-2">
                <button
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm"
                  onClick={() => {
                    editInGenerator(viewItem);
                  }}
                >
                  Edit in Generator
                </button>
                <button
                  className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm"
                  onClick={() => setViewItem(null)}
                >
                  Close
                </button>
              </div>
            </div>

            {!viewItem.content ? (
              <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                {viewItem.description || "No description."}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left column */}
                <section className="space-y-4">
                  {viewItem.content.summary && (
                    <div>
                      <h4 className="font-semibold">Summary</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
                        {viewItem.content.summary}
                      </p>
                    </div>
                  )}
                  {viewItem.content.theSpace && (
                    <div>
                      <h4 className="font-semibold">The Space</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-200">
                        {viewItem.content.theSpace}
                      </p>
                    </div>
                  )}
                  {!!(viewItem.content.highlights?.length) && (
                    <div>
                      <h4 className="font-semibold">Highlights</h4>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {viewItem.content.highlights.map((h: string) => (
                          <Chip key={`vh-${h}`}>{h}</Chip>
                        ))}
                      </ul>
                    </div>
                  )}
                  {viewItem.content.neighborhood && (
                    <div>
                      <h4 className="font-semibold">Neighborhood</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-200">
                        {viewItem.content.neighborhood}
                      </p>
                    </div>
                  )}
                </section>

                {/* Right column */}
                <section className="space-y-4">
                  {viewItem.content.guestAccess && (
                    <div>
                      <h4 className="font-semibold">Guest Access</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-200">
                        {viewItem.content.guestAccess}
                      </p>
                    </div>
                  )}
                  {viewItem.content.otherThings && (
                    <div>
                      <h4 className="font-semibold">Other Things to Note</h4>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-200">
                        {viewItem.content.otherThings}
                      </p>
                    </div>
                  )}
                  {!!(viewItem.content.amenities?.length) && (
                    <div>
                      <h4 className="font-semibold">Amenities</h4>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {viewItem.content.amenities.map((a: string) => (
                          <Chip key={`va-${a}`}>{a}</Chip>
                        ))}
                      </div>
                    </div>
                  )}
                  {!!(viewItem.content.sections?.length) && (
                    <div>
                      <h4 className="font-semibold">Sections</h4>
                      <div className="mt-2 space-y-3">
                        {viewItem.content.sections.map(
                          (s: { title: string; body: string }, i: number) => (
                            <div key={i}>
                              <div className="text-sm font-medium">{s.title}</div>
                              <div className="text-sm text-gray-200 whitespace-pre-wrap">
                                {s.body}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm"
                onClick={() =>
                  navigator.clipboard.writeText(
                    viewItem.content
                      ? `${viewItem.title}\n\n${viewItem.content.summary ?? ""}\n\n${viewItem.content.theSpace ?? ""}`
                      : `${viewItem.title}\n\n${viewItem.description ?? ""}`
                  )
                }
              >
                Copy text
              </button>
              <button
                className="rounded-lg border border-gray-700 px-3 py-1.5 text-sm"
                onClick={() => setViewItem(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
