// src/app/listing/[id]/page.tsx
import { notFound } from 'next/navigation';
import { createServer } from '@/lib/supabase/server';

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

export default async function ListingDetail(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) return notFound();

  const supabase = await createServer();

  const { data: l, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', idNum)
    .single();

  if (error || !l) return notFound();

  // Structured generator output if saved alongside the row
  const res: ResultPayload | undefined =
    (l as any).content_json ?? (l as any).result ?? undefined;

  const title =
    (l as any).title ||
    res?.titlePrimary ||
    res?.titles?.[0] ||
    'Untitled Listing';

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <a href="/app/my-listings" className="underline text-sm">← Back</a>

      {/* Header */}
      <header>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {(l as any).address && (
          <p className="opacity-70">{(l as any).address}</p>
        )}
        <p className="text-[13px] opacity-50">ID: {(l as any).id}</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {/* LEFT: basic facts + raw description (if you saved one) */}
        <section className="space-y-4">
          {typeof (l as any).price === 'number' && (l as any).price > 0 && (
            <div className="text-xl font-semibold">
              ${(l as any).price.toLocaleString()}
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {(l as any).bedrooms > 0 && (
              <div>
                Bedrooms:{' '}
                <span className="opacity-70">{(l as any).bedrooms}</span>
              </div>
            )}
            {(l as any).bathrooms > 0 && (
              <div>
                Bathrooms:{' '}
                <span className="opacity-70">{(l as any).bathrooms}</span>
              </div>
            )}
            {(l as any).squareFeet > 0 && (
              <div>
                Square feet:{' '}
                <span className="opacity-70">{(l as any).squareFeet}</span>
              </div>
            )}
            {(l as any).tone && (
              <div>
                Tone:{' '}
                <span className="opacity-70">{(l as any).tone}</span>
              </div>
            )}
          </div>

          {(l as any).description && (
            <section>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <article className="leading-7 opacity-90 whitespace-pre-wrap">
                {(l as any).description}
              </article>
            </section>
          )}
        </section>

        {/* RIGHT: structured AI output (if saved) */}
        <section className="space-y-6">
          {res?.summary && (
            <div>
              <h3 className="font-medium mb-1">Summary</h3>
              <p className="opacity-90">{res.summary}</p>
            </div>
          )}

          {res?.description && (
            <div>
              <h3 className="font-medium mb-1">Generated Description</h3>
              <article className="leading-7 opacity-90 whitespace-pre-wrap">
                {res.description}
              </article>
            </div>
          )}

          {!!res?.highlights?.length && (
            <div>
              <h3 className="font-medium mb-1">Highlights</h3>
              <ul className="list-disc pl-5">
                {res.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          {(res?.sections?.space || res?.sections?.access || res?.sections?.notes) && (
            <div className="space-y-3">
              <h3 className="font-medium">Sections</h3>
              {res.sections?.space && (
                <div>
                  <h4 className="font-medium">The Space</h4>
                  <p className="opacity-90 whitespace-pre-wrap">{res.sections.space}</p>
                </div>
              )}
              {res.sections?.access && (
                <div>
                  <h4 className="font-medium">Guest Access</h4>
                  <p className="opacity-90 whitespace-pre-wrap">{res.sections.access}</p>
                </div>
              )}
              {res.sections?.notes && (
                <div>
                  <h4 className="font-medium">Other Things to Note</h4>
                  <p className="opacity-90 whitespace-pre-wrap">{res.sections.notes}</p>
                </div>
              )}
            </div>
          )}

          {!!res?.amenities?.length && (
            <div>
              <h3 className="font-medium mb-1">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {res.amenities.map((a, i) => (
                  <span
                    key={i}
                    className="rounded-full border px-2 py-0.5 text-xs opacity-80"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {res?.neighborhood && (
            <div>
              <h3 className="font-medium mb-1">Neighborhood</h3>
              <p className="opacity-90 whitespace-pre-wrap">{res.neighborhood}</p>
            </div>
          )}

          {res?.rules && (
            <div>
              <h3 className="font-medium mb-1">House Rules</h3>
              <p className="opacity-90 whitespace-pre-wrap">{res.rules}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
