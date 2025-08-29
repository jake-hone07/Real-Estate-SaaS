import { redirect, notFound } from 'next/navigation';
import { createClientServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

type Sections = { space?: string; access?: string; notes?: string };
type ResultPayload = {
  titlePrimary?: string;
  titles?: string[];
  summary?: string;
  description?: string;
  highlights?: string[];
  sections?: Sections;
  amenities?: string[];
  neighborhood?: string;
  rules?: string;
  photoCaptions?: string[];
  social?: { x?: string; instagram?: string };
  seo?: string[];
  meta?: { word_count?: number; reading_time_sec?: number };
};

function positiveOrNull(n: unknown) {
  return typeof n === 'number' && n > 0 ? n : null;
}

export default async function ListingDetail({ params }: { params: { id: string } }) {
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) return notFound();

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', idNum)
    .single();

  if (error || !data) return notFound();

  const l: any = data;

  // Parse structured AI output if present
  let res: ResultPayload | null = null;
  try {
    res = typeof l.content_json === 'string'
      ? JSON.parse(l.content_json)
      : (l.content_json ?? null);
  } catch { res = null; }

  const bd  = positiveOrNull(l.bedrooms);
  const ba  = positiveOrNull(l.bathrooms);
  const sqft = positiveOrNull(l.squareFeet);
  const price = positiveOrNull(l.price);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {l.title || res?.titlePrimary || res?.titles?.[0] || 'Untitled Listing'}
          </h1>
          {l.address && <p className="opacity-70">{l.address}</p>}
          <p className="text-[11px] opacity-50 mt-1">ID: {l.id}</p>
        </div>
        <a href="/my-listings" className="underline text-sm">← Back</a>
      </div>

      {/* Price */}
      {price !== null && <div className="text-lg font-semibold">${price.toLocaleString()}</div>}

      {/* Quick facts (hide zeros) */}
      {(bd !== null || ba !== null || sqft !== null || l.tone) && (
        <div className="grid grid-cols-2 gap-4">
          {bd !== null   && <div><span className="opacity-70">Bedrooms:</span> {bd}</div>}
          {ba !== null   && <div><span className="opacity-70">Bathrooms:</span> {ba}</div>}
          {sqft !== null && <div><span className="opacity-70">Square feet:</span> {sqft}</div>}
          {l.tone       && <div><span className="opacity-70">Tone:</span> {l.tone}</div>}
        </div>
      )}

      {/* The same freeform description you edit in My Listings */}
      {l.description && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Description</h2>
          <article className="leading-7 opacity-90 whitespace-pre-wrap">{l.description}</article>
        </section>
      )}

      {/* ---------- Structured AI Output ---------- */}
      {res && (
        <section className="space-y-6">
          {/* Titles */}
          {(res.titlePrimary || (res.titles?.length ?? 0) > 0) && (
            <div>
              <h3 className="font-medium mb-1">Title variants</h3>
              <div className="space-y-1">
                {res.titlePrimary && <div className="font-medium">{res.titlePrimary}</div>}
                {(res.titles ?? []).map((t, i) => (
                  <div key={i} className="opacity-90">{t}</div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {res.summary && (
            <div>
              <h3 className="font-medium mb-1">Summary</h3>
              <p className="opacity-90">{res.summary}</p>
            </div>
          )}

          {/* Generated Description */}
          {res.description && (
            <div>
              <h3 className="font-medium mb-1">Generated Description</h3>
              <article className="leading-7 opacity-90">
                {res.description.split('\n\n').map((p, i) => (
                  <p key={i} className="mb-2">{p}</p>
                ))}
              </article>
            </div>
          )}

          {/* Highlights */}
          {!!res.highlights?.length && (
            <div>
              <h3 className="font-medium mb-1">Highlights</h3>
              <ul className="list-disc pl-5">
                {res.highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          )}

          {/* Airbnb sections */}
          {(res.sections?.space || res.sections?.access || res.sections?.notes) && (
            <div className="grid md:grid-cols-3 gap-4">
              {res.sections?.space && (
                <div>
                  <h4 className="font-medium">The Space</h4>
                  <p>{res.sections.space}</p>
                </div>
              )}
              {res.sections?.access && (
                <div>
                  <h4 className="font-medium">Guest Access</h4>
                  <p>{res.sections.access}</p>
                </div>
              )}
              {res.sections?.notes && (
                <div>
                  <h4 className="font-medium">Other Things to Note</h4>
                  <p>{res.sections.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Amenities */}
          {!!res.amenities?.length && (
            <div>
              <h3 className="font-medium mb-1">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {res.amenities.map((a, i) => (
                  <span key={i} className="rounded-full border border-white/20 px-2 py-0.5 text-xs opacity-80">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Neighborhood */}
          {res.neighborhood && (
            <div>
              <h3 className="font-medium mb-1">Neighborhood</h3>
              <p>{res.neighborhood}</p>
            </div>
          )}

          {/* House Rules */}
          {res.rules && (
            <div>
              <h3 className="font-medium mb-1">House Rules</h3>
              <p>{res.rules}</p>
            </div>
          )}

          {/* Photo captions */}
          {!!res.photoCaptions?.length && (
            <div>
              <h3 className="font-medium mb-1">Photo captions</h3>
              <ul className="list-disc pl-5">
                {res.photoCaptions.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {/* Social captions */}
          {(res.social?.x || res.social?.instagram) && (
            <div>
              <h3 className="font-medium mb-1">Social</h3>
              {res.social?.x && (
                <div className="rounded border border-white/20 p-2 mb-2">
                  <div className="text-xs opacity-70 mb-1">X</div>
                  <p>{res.social.x}</p>
                </div>
              )}
              {res.social?.instagram && (
                <div className="rounded border border-white/20 p-2">
                  <div className="text-xs opacity-70 mb-1">Instagram</div>
                  <p>{res.social.instagram}</p>
                </div>
              )}
            </div>
          )}

          {/* SEO */}
          {!!res.seo?.length && (
            <div>
              <h3 className="font-medium mb-1">SEO keywords</h3>
              <div className="flex flex-wrap gap-2">
                {res.seo.map((k, i) => (
                  <span key={i} className="rounded-full border border-white/20 px-2 py-0.5 text-xs opacity-80">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
