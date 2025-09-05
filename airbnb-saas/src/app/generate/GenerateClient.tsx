"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { qualityReport } from "@/lib/lint";

/** ---------- Types ---------- */
type TabKey =
  | "preview"
  | "title"
  | "summary"
  | "description"
  | "highlights"
  | "sections"
  | "amenities"
  | "neighborhood"
  | "rules"
  | "photos"
  | "social"
  | "seo";

type GenState = "idle" | "loading" | "done" | "error";

type Sections = { space?: string; access?: string; notes?: string };

type ResultPayload = {
  // core
  titlePrimary?: string;
  titles?: string[];
  summary?: string;
  description?: string;
  highlights?: string[];
  sections?: Sections;
  // extended
  amenities?: string[];
  neighborhood?: string;
  rules?: string;
  photoCaptions?: string[];
  social?: { x?: string; instagram?: string };
  seo?: string[];
  meta?: { word_count?: number; reading_time_sec?: number };
};

type Options = {
  tone: string;
  audience: string;
  wordBudget: number;
  language: string;
  platform: "Airbnb" | "VRBO" | "Booking";
  season?: "Default" | "Spring" | "Summer" | "Fall" | "Winter";
  unit: "imperial" | "metric";
  includeTitle: boolean;
  includeHighlights: boolean;
  includeCaption: boolean;
  includeSEO: boolean;
  includeSections: boolean;
  includeAmenities: boolean;
  includeNeighborhood: boolean;
  includeRules: boolean;
  includePhotos: boolean;
};

const DEFAULT_OPTIONS: Options = {
  tone: "Warm & professional",
  audience: "Families & small groups",
  wordBudget: 180,
  language: "English",
  platform: "Airbnb",
  season: "Default",
  unit: "imperial",
  includeTitle: true,
  includeHighlights: true,
  includeCaption: true,
  includeSEO: true,
  includeSections: true,
  includeAmenities: true,
  includeNeighborhood: true,
  includeRules: true,
  includePhotos: true,
};

const MIN_CHARS = 140;

/** ---------- Component ---------- */
export default function GenerateClient() {
  const router = useRouter();

  /** Inputs */
  const [basics, setBasics] = useState("");
  const [highlightsIn, setHighlightsIn] = useState("");
  const [locationIn, setLocationIn] = useState("");
  const [rulesIn, setRulesIn] = useState("");

  /** Options */
  const [opt, setOpt] = useState<Options>(DEFAULT_OPTIONS);

  /** State */
  const [state, setState] = useState<GenState>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<ResultPayload>({});
  const [active, setActive] = useState<TabKey>("preview");
  const [copied, setCopied] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled listing");
  const [saving, setSaving] = useState(false);
  const rightRef = useRef<HTMLDivElement>(null);

  /** Derived */
  const fullFacts = useMemo(() => {
    const parts = [
      basics && `BASICS:\n${basics.trim()}`,
      highlightsIn && `HIGHLIGHTS:\n${highlightsIn.trim()}`,
      locationIn && `LOCATION:\n${locationIn.trim()}`,
      rulesIn && `HOUSE RULES:\n${rulesIn.trim()}`,
    ].filter(Boolean);
    return parts.join("\n\n").trim();
  }, [basics, highlightsIn, locationIn, rulesIn]);

  const chars = fullFacts.length;
  const quality = useMemo(() => qualityReport(fullFacts), [fullFacts]);
  const disableGenerate = state === "loading" || chars < MIN_CHARS;

  /** Autosave */
  useEffect(() => {
    const raw = localStorage.getItem("lg_project_v2");
    if (raw) {
      try {
        const p = JSON.parse(raw);
        setBasics(p.basics ?? "");
        setHighlightsIn(p.highlightsIn ?? "");
        setLocationIn(p.locationIn ?? "");
        setRulesIn(p.rulesIn ?? "");
        setOpt({ ...DEFAULT_OPTIONS, ...(p.opt || {}) });
        setProjectName(p.projectName || "Untitled listing");
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "lg_project_v2",
      JSON.stringify({ basics, highlightsIn, locationIn, rulesIn, opt, projectName })
    );
  }, [basics, highlightsIn, locationIn, rulesIn, opt, projectName]);

  /** Keyboard shortcut: Cmd/Ctrl + Enter = Generate */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        void onGenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullFacts, opt]);

  /** Helpers */
  function setOptField<K extends keyof Options>(k: K, v: Options[K]) {
    setOpt((prev) => ({ ...prev, [k]: v }));
  }
  const field = useCallback(
    (label: string, value: string, setter: (s: string) => void, placeholder: string) => (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">{label}</label>
        <textarea
          value={value}
          onChange={(e) => setter(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-28 rounded-md border border-gray-700 bg-transparent p-3 text-gray-100 outline-none focus:ring-2 focus:ring-gray-500"
        />
      </div>
    ),
    []
  );
  const pill = (text: string, onClick: () => void, active?: boolean) => (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs ${active ? "border-gray-400 bg-white/5" : "border-gray-700 text-gray-300 hover:bg-white/5"}`}
    >
      {text}
    </button>
  );
  function flash(key: string) {
    setCopied(key);
    setTimeout(() => setCopied(null), 1100);
  }

  /** Sample */
  function insertSample() {
    setBasics(
      "2BR/1BA condo • sleeps 4 • private balcony • fast Wi-Fi • desk/workspace • in-unit laundry • free parking"
    );
    setHighlightsIn(
      "Floor-to-ceiling windows, sunset mountain view, espresso machine, blackout curtains, quiet building"
    );
    setLocationIn(
      "5-min walk to cafés, 7-min to riverwalk, 12-min to convention center; 15-min drive to airport"
    );
    setRulesIn("No parties • quiet hours 10pm–7am • no smoking/vaping • pets on approval only");
    setOpt((p) => ({ ...p, tone: "Warm & professional", audience: "Couples & business travelers" }));
  }

  /** API */
  async function callApi(payload: any) {
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = await r.json();
    if (json.error) throw new Error(json.error);
    return json as { result: ResultPayload };
  }

  async function onGenerate() {
    if (chars < MIN_CHARS) {
      setErr(`Add a bit more detail first (≥ ${MIN_CHARS} characters).`);
      return;
    }
    setState("loading");
    setErr(null);
    try {
      const { result } = await callApi({ facts: fullFacts, options: opt });
      setRes(result || {});
      setState("done");
      setActive("preview");
      requestAnimationFrame(() => rightRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
      setState("error");
    }
  }

  async function regeneratePart(part: string, tweak?: string) {
    setState("loading");
    setErr(null);
    try {
      const { result } = await callApi({
        facts: fullFacts,
        options: opt,
        requestParts: [part],
        tweak,
      });
      setRes((prev) => ({ ...prev, ...(result || {}) }));
      setState("done");
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
      setState("error");
    }
  }

  /** Copy / Export */
  function copyText(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
  }
  function copyList(items?: string[], bullet = "• ") {
    if (!items?.length) return;
    navigator.clipboard.writeText(items.map((x) => `${bullet}${x}`).join("\n"));
  }
  function copySections(s?: Sections) {
    if (!s) return;
    const t = [
      s.space ? `THE SPACE:\n${s.space}` : "",
      s.access ? `GUEST ACCESS:\n${s.access}` : "",
      s.notes ? `OTHER THINGS TO NOTE:\n${s.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    copyText(t);
  }
  function copyAllForAirbnb() {
    const chunks = [
      res.titlePrimary ? `TITLE:\n${res.titlePrimary}` : "",
      res.summary ? `SUMMARY:\n${res.summary}` : "",
      res.description ? `DESCRIPTION:\n${res.description}` : "",
      res.sections?.space ? `THE SPACE:\n${res.sections.space}` : "",
      res.sections?.access ? `GUEST ACCESS:\n${res.sections.access}` : "",
      res.sections?.notes ? `OTHER THINGS TO NOTE:\n${res.sections.notes}` : "",
      res.highlights?.length ? `HIGHLIGHTS:\n${res.highlights.map((b) => `• ${b}`).join("\n")}` : "",
      res.amenities?.length ? `AMENITIES:\n${res.amenities.map((b) => `• ${b}`).join("\n")}` : "",
      res.neighborhood ? `NEIGHBORHOOD:\n${res.neighborhood}` : "",
      res.rules ? `HOUSE RULES:\n${res.rules}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!chunks) return;
    copyText(chunks);
    flash("all");
  }

  /** Save to Supabase (V1: full structured payload) */
  function buildContentJSON() {
    return {
      // Normalize to what /my-listings full view expects
      summary: res.summary ?? null,
      theSpace: res.sections?.space ?? null,
      guestAccess: res.sections?.access ?? null,
      otherThings: res.sections?.notes ?? null,
      amenities: res.amenities ?? [],
      highlights: res.highlights ?? [],
      neighborhood: res.neighborhood ?? null,
      rulesText: res.rules ?? null,
      sections: [
        ...(res.sections?.space ? [{ title: "The Space", body: res.sections.space }] : []),
        ...(res.sections?.access ? [{ title: "Guest Access", body: res.sections.access }] : []),
        ...(res.sections?.notes ? [{ title: "Other Things to Note", body: res.sections.notes }] : []),
      ],
      photoCaptions: res.photoCaptions ?? [],
      social: res.social ?? {},
      seo: res.seo ?? [],
      meta: res.meta ?? {},
      // Keep original pieces too
      raw: res,
      projectName,
      options: opt,
      facts: fullFacts,
    };
  }

  async function saveToMyListings() {
    if (state !== "done") return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/generate");
        return;
      }

      const title =
        res.titlePrimary ||
        res.titles?.[0] ||
        projectName ||
        "Untitled listing";

      const longText =
        [res.summary, res.description].filter(Boolean).join("\n\n") || null;

      const payload = {
        user_id: user.id,
        title,
        description: longText,
        price: null as number | null, // (optional; you can wire a field later)
        content: buildContentJSON(),
      };

      const { error } = await supabase.from("listings").insert([payload]);
      if (error) throw error;

      router.push("/my-listings");
    } catch (e: any) {
      alert(e?.message ?? "Failed to save listing");
    } finally {
      setSaving(false);
    }
  }

  /** UI */
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* LEFT: INPUTS */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="rounded-md border border-gray-700 bg-transparent px-2 py-1 text-sm"
            placeholder="Project name"
          />
        </div>

        {/* Quality */}
        <div className="rounded-lg border border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {pill("Insert sample", insertSample)}
              {pill("Clear", () => {
                setBasics("");
                setHighlightsIn("");
                setLocationIn("");
                setRulesIn("");
              })}
            </div>
            <span className="text-xs text-gray-400">
              {chars}/{MIN_CHARS}+ chars
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded bg-gray-800/50">
            <div
              className={`h-full ${
                quality.score > 80
                  ? "bg-emerald-500"
                  : quality.score > 60
                  ? "bg-amber-400"
                  : "bg-rose-500"
              }`}
              style={{ width: `${quality.score}%` }}
            />
          </div>
          {!!quality.reasons.length && (
            <ul className="mt-2 list-disc pl-5 text-xs text-gray-400">
              {quality.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>

        {field(
          "Basics",
          basics,
          setBasics,
          "Beds/baths, sleeps, property type, standout amenities, parking, Wi-Fi…"
        )}
        {field(
          "Highlights",
          highlightsIn,
          setHighlightsIn,
          "Unique touches: view, hot tub, fire pit, chef’s kitchen, espresso machine, blackout curtains…"
        )}
        {field(
          "Location",
          locationIn,
          setLocationIn,
          "Walking times (cafés, groceries, transit), nearby attractions, neighborhood vibe…"
        )}
        {field(
          "House rules",
          rulesIn,
          setRulesIn,
          "Quiet hours, parties, pets, smoking…"
        )}

        {/* Options */}
        <div className="rounded-lg border border-gray-700 p-4 space-y-4">
          <h3 className="font-medium">Options</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Tone"
              value={opt.tone}
              onChange={(v) => setOptField("tone", v)}
              items={[
                "Warm & professional",
                "Friendly & upbeat",
                "Calm & minimalist",
                "Luxury, refined",
                "Family-friendly",
              ]}
            />
            <Select
              label="Audience"
              value={opt.audience}
              onChange={(v) => setOptField("audience", v)}
              items={[
                "Families & small groups",
                "Couples & business travelers",
                "Remote workers",
                "Adventure travelers",
                "Long-term stays",
              ]}
            />
            <div>
              <label className="mb-1 block text-sm text-gray-300">
                Word budget:{" "}
                <span className="text-gray-400">{opt.wordBudget} words</span>
              </label>
              <input
                type="range"
                min={120}
                max={260}
                step={10}
                value={opt.wordBudget}
                onChange={(e) =>
                  setOptField("wordBudget", parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>
            <Select
              label="Language"
              value={opt.language}
              onChange={(v) => setOptField("language", v)}
              items={[
                "English",
                "Spanish",
                "French",
                "German",
                "Portuguese",
                "Italian",
                "Japanese",
                "Chinese",
              ]}
            />
            <Select
              label="Platform style"
              value={opt.platform}
              onChange={(v) => setOptField("platform", v as any)}
              items={["Airbnb", "VRBO", "Booking"]}
            />
            <Select
              label="Season"
              value={opt.season || "Default"}
              onChange={(v) => setOptField("season", v as any)}
              items={["Default", "Spring", "Summer", "Fall", "Winter"]}
            />
            <Select
              label="Units"
              value={opt.unit}
              onChange={(v) => setOptField("unit", v as any)}
              items={["imperial", "metric"]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Toggle
              label="Title"
              value={opt.includeTitle}
              onChange={(v) => setOptField("includeTitle", v)}
            />
            <Toggle
              label="Highlights"
              value={opt.includeHighlights}
              onChange={(v) => setOptField("includeHighlights", v)}
            />
            <Toggle
              label="Social"
              value={opt.includeCaption}
              onChange={(v) => setOptField("includeCaption", v)}
            />
            <Toggle
              label="SEO"
              value={opt.includeSEO}
              onChange={(v) => setOptField("includeSEO", v)}
            />
            <Toggle
              label="Sections"
              value={opt.includeSections}
              onChange={(v) => setOptField("includeSections", v)}
            />
            <Toggle
              label="Amenities"
              value={opt.includeAmenities}
              onChange={(v) => setOptField("includeAmenities", v)}
            />
            <Toggle
              label="Neighborhood"
              value={opt.includeNeighborhood}
              onChange={(v) => setOptField("includeNeighborhood", v)}
            />
            <Toggle
              label="Rules"
              value={opt.includeRules}
              onChange={(v) => setOptField("includeRules", v)}
            />
            <Toggle
              label="Photo captions"
              value={opt.includePhotos}
              onChange={(v) => setOptField("includePhotos", v)}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onGenerate}
            disabled={disableGenerate}
            className="rounded-md border border-gray-600 px-4 py-2 text-sm disabled:opacity-50"
          >
            {state === "loading" ? "Generating…" : "Generate"}
          </button>
          {err && <span className="text-sm text-rose-400">{err}</span>}
        </div>
      </section>

      {/* RIGHT: RESULTS */}
      <section
        ref={rightRef}
        className="rounded-lg border border-gray-700 p-4 md:sticky md:top-6 h-fit"
      >
        {/* Tabs + Actions */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(
            [
              "preview",
              "title",
              "summary",
              "description",
              "highlights",
              "sections",
              "amenities",
              "neighborhood",
              "rules",
              "photos",
              "social",
              "seo",
            ] as TabKey[]
          ).map((k) => (
            <button
              key={k}
              onClick={() => setActive(k)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                active === k
                  ? "border border-gray-500 bg-white/5"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              {label(k)}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            {state === "done" && (
              <button
                onClick={saveToMyListings}
                disabled={saving}
                className="rounded-md bg-white px-2 py-1 text-xs text-black disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save to My Listings"}
              </button>
            )}
            <button
              onClick={copyAllForAirbnb}
              className="rounded-md border border-gray-600 px-2 py-1 text-xs"
            >
              {copied === "all" ? "Copied!" : "Copy All for Airbnb"}
            </button>
            <button
              onClick={() => {
                const payload = {
                  project: projectName,
                  options: opt,
                  facts: fullFacts,
                  result: res,
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "listing.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-md border border-gray-600 px-2 py-1 text-xs"
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* States */}
        {state === "idle" && (
          <p className="text-sm text-gray-500">
            Your results will appear here after you generate.
          </p>
        )}
        {state === "loading" && (
          <div className="animate-pulse space-y-2">
            <div className="h-4 rounded bg-gray-800/50" />
            <div className="h-4 w-5/6 rounded bg-gray-800/50" />
            <div className="h-4 w-4/6 rounded bg-gray-800/50" />
            <div className="h-4 w-2/6 rounded bg-gray-800/50" />
          </div>
        )}
        {state === "error" && (
          <p className="text-sm text-rose-400">{err || "Something went wrong."}</p>
        )}

        {state === "done" && (
          <div className="space-y-4">
            {active === "preview" && <PreviewPanel res={res} />}

            {active === "title" && (
              <TitlesBlock
                primary={res.titlePrimary || ""}
                titles={res.titles || []}
                onCopyPrimary={() => {
                  copyText(res.titlePrimary || "");
                  flash("title1");
                }}
                onCopyAll={() => {
                  copyList(res.titles || [], "");
                  flash("titleall");
                }}
                onRegenerate={() => regeneratePart("titles")}
                platform={"Airbnb"}
              />
            )}

            {active === "summary" && (
              <RefinableBlock
                title="Summary"
                text={res.summary || ""}
                onCopy={() => {
                  copyText(res.summary || "");
                  flash("summary");
                }}
                onDownload={() => downloadText(res.summary, "summary.txt")}
                refine={(t) => regeneratePart("summary", t)}
                options={["Shorter", "Longer", "More luxury", "More family-friendly", "Tighter"]}
              />
            )}

            {active === "description" && (
              <RefinableBlock
                title="Description"
                text={res.description || ""}
                onCopy={() => {
                  copyText(res.description || "");
                  flash("desc");
                }}
                onDownload={() => downloadText(res.description, "description.txt")}
                refine={(t) => regeneratePart("description", t)}
                options={["Shorter", "Longer", "More sensory", "More minimalist", "Tighter"]}
              />
            )}

            {active === "highlights" && (
              <ListBlock
                title="Highlights"
                items={res.highlights || []}
                onCopy={() => {
                  copyList(res.highlights);
                  flash("highlights");
                }}
                onDownload={() => downloadList(res.highlights, "highlights.txt")}
                onRegenerate={() => regeneratePart("highlights")}
                tip="Use concrete claims and unique amenities."
              />
            )}

            {active === "sections" && (
              <SectionsBlock
                sections={res.sections || {}}
                onCopy={() => {
                  copySections(res.sections);
                  flash("sections");
                }}
                onDownload={() =>
                  downloadText(
                    [
                      res.sections?.space ? `THE SPACE:\n${res.sections.space}` : "",
                      res.sections?.access ? `GUEST ACCESS:\n${res.sections.access}` : "",
                      res.sections?.notes ? `OTHER THINGS TO NOTE:\n${res.sections.notes}` : "",
                    ]
                      .filter(Boolean)
                      .join("\n\n"),
                    "airbnb-sections.txt"
                  )
                }
                onRegenerate={() => regeneratePart("sections")}
              />
            )}

            {active === "amenities" && (
              <ListBlock
                title="Amenities"
                items={res.amenities || []}
                onCopy={() => {
                  copyList(res.amenities);
                  flash("amenities");
                }}
                onDownload={() => downloadList(res.amenities, "amenities.txt")}
                onRegenerate={() => regeneratePart("amenities")}
                tip="Group similar items; avoid duplicates."
              />
            )}

            {active === "neighborhood" && (
              <RefinableBlock
                title="Neighborhood"
                text={res.neighborhood || ""}
                onCopy={() => {
                  copyText(res.neighborhood || "");
                  flash("neighborhood");
                }}
                onDownload={() => downloadText(res.neighborhood, "neighborhood.txt")}
                refine={(t) => regeneratePart("neighborhood", t)}
                options={["Shorter", "Longer", "More landmarks", "More walkability"]}
              />
            )}

            {active === "rules" && (
              <RefinableBlock
                title="House Rules"
                text={res.rules || ""}
                onCopy={() => {
                  copyText(res.rules || "");
                  flash("rules");
                }}
                onDownload={() => downloadText(res.rules, "rules.txt")}
                refine={(t) => regeneratePart("rules", t)}
                options={["More concise", "Friendlier tone", "Stricter tone"]}
              />
            )}

            {active === "photos" && (
              <ListBlock
                title="Photo captions"
                items={res.photoCaptions || []}
                onCopy={() => {
                  copyList(res.photoCaptions, "");
                  flash("photos");
                }}
                onDownload={() => downloadList(res.photoCaptions, "photo-captions.txt")}
                onRegenerate={() => regeneratePart("photos")}
                tip="Pair each caption with the matching image when you upload."
              />
            )}

            {active === "social" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Social captions</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => regeneratePart("social")}
                      className="rounded-md border border-gray-600 px-2 py-1 text-xs"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => {
                        copyText(
                          [res.social?.x, res.social?.instagram].filter(Boolean).join("\n\n")
                        );
                        flash("social");
                      }}
                      className="rounded-md border border-gray-600 px-2 py-1 text-xs"
                    >
                      {copied === "social" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <Card label={`X (≤180) — ${res.social?.x?.length ?? 0}/180`} body={res.social?.x} />
                <Card label={`Instagram — ${res.social?.instagram?.length ?? 0}`} body={res.social?.instagram} />
              </div>
            )}

            {active === "seo" && (
              <ListBlock
                title="SEO keywords"
                items={res.seo || []}
                onCopy={() => {
                  copyText((res.seo || []).join(", "));
                  flash("seo");
                }}
                onDownload={() => downloadText((res.seo || []).join(", "), "seo-tags.txt")}
                onRegenerate={() => regeneratePart("seo")}
                tip="Mix neighborhood + property-type + standout amenities."
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

/** ---------- Small subcomponents ---------- */
function Select({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm"
      >
        {items.map((t) => (
          <option key={t} value={t} className="bg-black">
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

function Card({ label, body }: { label: string; body?: string }) {
  return (
    <div className="rounded-md border border-gray-700 p-2">
      <div className="mb-1 text-xs text-gray-400">{label}</div>
      <p className="text-gray-100">{body || "—"}</p>
    </div>
  );
}

/** Titles block for primary + A/B/C titles */
function TitlesBlock({
  primary,
  titles,
  onCopyPrimary,
  onCopyAll,
  onRegenerate,
  platform,
}: {
  primary: string;
  titles: string[];
  onCopyPrimary: () => void;
  onCopyAll: () => void;
  onRegenerate: () => void;
  platform: "Airbnb" | "VRBO" | "Booking";
}) {
  const limit = platform === "Airbnb" ? 32 : platform === "VRBO" ? 60 : 70;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Title (Primary + A/B/C)</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Regenerate
          </button>
          <button
            onClick={onCopyAll}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Copy All
          </button>
        </div>
      </div>

      {/* Primary title */}
      <div className="rounded-md border border-gray-700 p-2">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
          <span>Primary</span>
          <span>
            {primary.length}/{limit}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`font-medium ${
              primary.length > limit ? "text-amber-400" : ""
            }`}
          >
            {primary || "—"}
          </span>
          <button
            onClick={onCopyPrimary}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Alternates */}
      <div className="space-y-2">
        {(titles || []).length ? (
          titles.map((t, i) => (
            <div key={i} className="rounded-md border border-gray-700 p-2">
              <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
                <span>Alt {String.fromCharCode(65 + i)}</span>
                <span>
                  {t.length}/{limit}
                </span>
              </div>
              <span
                className={`font-medium ${
                  t.length > limit ? "text-amber-400" : ""
                }`}
              >
                {t}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No alternate titles generated.</p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Tip: Airbnb truncates around ~32 characters—lead with your strongest
        concrete hook.
      </p>
    </div>
  );
}

function RefinableBlock({
  title,
  text,
  onCopy,
  onDownload,
  refine,
  options,
}: {
  title: string;
  text: string;
  onCopy: () => void;
  onDownload: () => void;
  refine: (tweak: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium">{title}</h4>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-gray-700 bg-transparent px-2 py-1 text-xs"
            onChange={(e) => e.target.value && refine(e.target.value)}
            defaultValue=""
          >
            <option value="" className="bg-black">
              Refine…
            </option>
            {options.map((o) => (
              <option key={o} value={o} className="bg-black">
                {o}
              </option>
            ))}
          </select>
          <button
            onClick={onCopy}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Copy
          </button>
          <button
            onClick={onDownload}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Download
          </button>
        </div>
      </div>
      <article className="leading-7 text-gray-100">
        {text ? (
          text.split("\n\n").map((p, i) => (
            <p key={i} className="mb-2">
              {p}
            </p>
          ))
        ) : (
          <p className="text-sm text-gray-500">No content generated.</p>
        )}
      </article>
    </div>
  );
}

function SectionsBlock({
  sections,
  onCopy,
  onDownload,
  onRegenerate,
}: {
  sections: { space?: string; access?: string; notes?: string };
  onCopy: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Airbnb sections</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Regenerate
          </button>
          <button
            onClick={onCopy}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Copy
          </button>
          <button
            onClick={onDownload}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Download
          </button>
        </div>
      </div>
      <article className="space-y-3 leading-7 text-gray-100">
        <div>
          <h5 className="font-medium">The Space</h5>
          <p>{sections.space || "—"}</p>
        </div>
        <div>
          <h5 className="font-medium">Guest Access</h5>
          <p>{sections.access || "—"}</p>
        </div>
        <div>
          <h5 className="font-medium">Other Things to Note</h5>
          <p>{sections.notes || "—"}</p>
        </div>
      </article>
    </div>
  );
}

function ListBlock({
  title,
  items,
  onCopy,
  onDownload,
  onRegenerate,
  tip,
}: {
  title: string;
  items: string[];
  onCopy: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  tip?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Regenerate
          </button>
          <button
            onClick={onCopy}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Copy
          </button>
          <button
            onClick={onDownload}
            className="rounded-md border border-gray-600 px-2 py-1 text-xs"
          >
            Download
          </button>
        </div>
      </div>
      {items.length ? (
        <ul className="list-disc pl-5 leading-7 text-gray-100">
          {items.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No items generated.</p>
      )}
      {tip && <p className="text-xs text-gray-400">{tip}</p>}
    </div>
  );
}

/** Simple “looks like Airbnb” preview */
function PreviewPanel({ res }: { res: ResultPayload }) {
  return (
    <div className="rounded-lg border border-gray-700 p-4">
      <div className="mb-2">
        <h2 className="text-xl font-semibold">
          {res.titlePrimary || res.titles?.[0] || "Your title will appear here"}
        </h2>
        <p className="text-sm text-gray-400">
          {res.meta?.word_count ? `${res.meta.word_count} words` : ""}{" "}
        </p>
      </div>

      {res.summary && (
        <div className="mb-4">
          <h3 className="mb-1 font-medium">Summary</h3>
          <p className="text-gray-100">{res.summary}</p>
        </div>
      )}

      {res.description && (
        <div className="mb-4">
          <h3 className="mb-1 font-medium">Description</h3>
          <article className="leading-7 text-gray-100">
            {res.description.split("\n\n").map((p, i) => (
              <p key={i} className="mb-2">
                {p}
              </p>
            ))}
          </article>
        </div>
      )}

      {!!res.highlights?.length && (
        <div className="mb-4">
          <h3 className="mb-1 font-medium">Highlights</h3>
          <ul className="list-disc pl-5 text-gray-100">
            {res.highlights.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {(res.sections?.space || res.sections?.access || res.sections?.notes) && (
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          {res.sections?.space && (
            <div>
              <h4 className="mb-1 font-medium">The Space</h4>
              <p className="text-gray-100">{res.sections.space}</p>
            </div>
          )}
          {res.sections?.access && (
            <div>
              <h4 className="mb-1 font-medium">Guest Access</h4>
              <p className="text-gray-100">{res.sections.access}</p>
            </div>
          )}
          {res.sections?.notes && (
            <div>
              <h4 className="mb-1 font-medium">Other Things to Note</h4>
              <p className="text-gray-100">{res.sections.notes}</p>
            </div>
          )}
        </div>
      )}

      {!!res.amenities?.length && (
        <div className="mb-4">
          <h3 className="mb-1 font-medium">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {res.amenities.map((a, i) => (
              <span
                key={i}
                className="rounded-full border border-gray-700 px-2 py-1 text-xs text-gray-300"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {res.neighborhood && (
        <div className="mb-4">
          <h3 className="mb-1 font-medium">Neighborhood</h3>
          <p className="text-gray-100">{res.neighborhood}</p>
        </div>
      )}

      {res.rules && (
        <div>
          <h3 className="mb-1 font-medium">House Rules</h3>
          <p className="text-gray-100">{res.rules}</p>
        </div>
      )}
    </div>
  );
}

/** tiny helpers */
function downloadText(text?: string, name = "text.txt") {
  if (!text) return;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function downloadList(items?: string[], name = "list.txt") {
  if (!items?.length) return;
  downloadText(items.join("\n"), name);
}
function label(k: TabKey) {
  const map: Record<TabKey, string> = {
    preview: "Preview",
    title: "Title",
    summary: "Summary",
    description: "Description",
    highlights: "Highlights",
    sections: "Sections",
    amenities: "Amenities",
    neighborhood: "Neighborhood",
    rules: "Rules",
    photos: "Photo captions",
    social: "Social",
    seo: "SEO",
  };
  return map[k];
}
