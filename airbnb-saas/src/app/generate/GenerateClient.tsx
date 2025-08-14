"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { qualityReport } from "@/lib/lint";

type TabKey = "description" | "titles" | "highlights" | "sections" | "social" | "seo";
type GenState = "idle" | "loading" | "done" | "error";
type Sections = { space?: string; access?: string; notes?: string; };
type ResultPayload = {
  description?: string;
  titles?: string[];       // A/B/C
  highlights?: string[];
  sections?: Sections;
  social?: { x?: string; instagram?: string };
  seo?: string[];
  meta?: { word_count?: number; reading_time_sec?: number; flags?: any };
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
};

const MIN_CHARS = 140;
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
};

type Version = { when: number; result: ResultPayload; options: Options; facts: string; };

export default function GenerateClient() {
  // Inputs split by helpful sections
  const [basics, setBasics] = useState("");
  const [highlights, setHighlights] = useState("");
  const [location, setLocation] = useState("");
  const [rules, setRules] = useState("");

  // Options
  const [opt, setOpt] = useState<Options>(DEFAULT_OPTIONS);

  // State
  const [state, setState] = useState<GenState>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [res, setRes] = useState<ResultPayload>({});
  const [active, setActive] = useState<TabKey>("description");
  const [copied, setCopied] = useState<string | null>(null);
  const [history, setHistory] = useState<Version[]>([]);
  const [projectName, setProjectName] = useState("Untitled listing");

  const rightRef = useRef<HTMLDivElement>(null);

  // Derived full facts
  const fullFacts = useMemo(() => {
    const parts = [
      basics && `BASICS:\n${basics.trim()}`,
      highlights && `HIGHLIGHTS:\n${highlights.trim()}`,
      location && `LOCATION:\n${location.trim()}`,
      rules && `HOUSE RULES:\n${rules.trim()}`,
    ].filter(Boolean);
    return parts.join("\n\n").trim();
  }, [basics, highlights, location, rules]);

  const charCount = fullFacts.length;
  const q = useMemo(() => qualityReport(fullFacts), [fullFacts]);

  // Autosave/restore
  useEffect(() => {
    const raw = localStorage.getItem("lg_project");
    if (raw) {
      try {
        const p = JSON.parse(raw);
        if (p.basics !== undefined) setBasics(p.basics);
        if (p.highlights !== undefined) setHighlights(p.highlights);
        if (p.location !== undefined) setLocation(p.location);
        if (p.rules !== undefined) setRules(p.rules);
        if (p.opt) setOpt(p.opt);
        if (p.projectName) setProjectName(p.projectName);
      } catch {}
    }
    const rawHist = localStorage.getItem("lg_history");
    if (rawHist) try { setHistory(JSON.parse(rawHist)); } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("lg_project", JSON.stringify({ basics, highlights, location, rules, opt, projectName }));
  }, [basics, highlights, location, rules, opt, projectName]);

  useEffect(() => {
    localStorage.setItem("lg_history", JSON.stringify(history.slice(0, 5)));
  }, [history]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        onGenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullFacts, opt]);

  function setOptField<K extends keyof Options>(key: K, value: Options[K]) {
    setOpt(prev => ({ ...prev, [key]: value }));
  }

  function insertSample() {
    setBasics("2BR/1BA condo • sleeps 4 • private balcony • fast Wi-Fi • workspace • in-unit laundry • free parking");
    setHighlights("Floor-to-ceiling windows, sunset mountain view, espresso machine, blackout curtains, quiet building");
    setLocation("5 min walk to cafés, 7 min to riverwalk, 12 min to convention center; 15-min drive to airport");
    setRules("No parties • quiet hours 10pm–7am • no smoking/vaping • pets on approval only");
    setOpt(prev => ({ ...prev, tone: "Warm & professional", audience: "Couples & business travelers", wordBudget: 180 }));
  }

  async function callApi(payload: any) {
    const resp = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  async function onGenerate() {
    if (charCount < MIN_CHARS) { setErr(`Add more detail (≥ ${MIN_CHARS} chars).`); return; }
    setState("loading"); setErr(null); setActive("description"); setRes({});
    try {
      const data = await callApi({ facts: fullFacts, options: opt });
      const result: ResultPayload = data.result || {};
      setRes(result);
      setState("done");
      setHistory(prev => [{ when: Date.now(), result, options: opt, facts: fullFacts }, ...prev].slice(0, 5));
      requestAnimationFrame(() => rightRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
      setState("error");
    }
  }

  async function onRegenerate(part: "description" | "titles" | "highlights" | "sections" | "social" | "seo", tweak?: string) {
    setState("loading"); setErr(null);
    try {
      const data = await callApi({ facts: fullFacts, options: opt, requestParts: [part], tweak });
      const next: ResultPayload = { ...res, ...(data.result || {}) };
      setRes(next);
      setState("done");
      setHistory(prev => [{ when: Date.now(), result: next, options: opt, facts: fullFacts }, ...prev].slice(0, 5));
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
      setState("error");
    }
  }

  function copy(text: string | string[] | Sections | undefined, key: string) {
    let out = "";
    if (typeof text === "string") out = text;
    else if (Array.isArray(text)) out = text.join("\n");
    else if (text && typeof text === "object") {
      out = [
        text.space ? `THE SPACE:\n${text.space}` : "",
        text.access ? `GUEST ACCESS:\n${text.access}` : "",
        text.notes ? `OTHER THINGS TO NOTE:\n${text.notes}` : "",
      ].filter(Boolean).join("\n\n");
    }
    if (!out) return;
    navigator.clipboard.writeText(out);
    setCopied(key); setTimeout(() => setCopied(null), 1200);
  }

  function download(text: string | string[] | Sections | undefined, filename: string) {
    let out = "";
    if (typeof text === "string") out = text;
    else if (Array.isArray(text)) out = text.join("\n");
    else if (text && typeof text === "object") {
      out = [
        text.space ? `THE SPACE:\n${text.space}` : "",
        text.access ? `GUEST ACCESS:\n${text.access}` : "",
        text.notes ? `OTHER THINGS TO NOTE:\n${text.notes}` : "",
      ].filter(Boolean).join("\n\n");
    }
    if (!out) return;
    const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    const payload = {
      project: projectName,
      options: opt,
      facts: fullFacts,
      result: res,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "listing.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function copyAllForAirbnb() {
    const chunks = [
      res.titles?.[0] ? `TITLE:\n${res.titles[0]}` : "",
      res.description ? `DESCRIPTION:\n${res.description}` : "",
      res.sections?.space ? `THE SPACE:\n${res.sections.space}` : "",
      res.sections?.access ? `GUEST ACCESS:\n${res.sections.access}` : "",
      res.sections?.notes ? `OTHER THINGS TO NOTE:\n${res.sections.notes}` : "",
      res.highlights?.length ? `HIGHLIGHTS:\n${res.highlights.map(b => `• ${b}`).join("\n")}` : "",
      res.seo?.length ? `SEO TAGS:\n${res.seo.join(", ")}` : "",
    ].filter(Boolean).join("\n\n");
    if (!chunks) return;
    navigator.clipboard.writeText(chunks);
    setCopied("all"); setTimeout(() => setCopied(null), 1200);
  }

  const disableGen = state === "loading" || charCount < MIN_CHARS;

  // UI helpers
  const field = useCallback((label: string, value: string, setter: (s: string) => void, placeholder: string) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-300">{label}</label>
      <textarea
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-28 rounded-md border border-gray-700 bg-transparent p-3 text-gray-100 outline-none focus:ring-2 focus:ring-gray-500"
      />
    </div>
  ), []);

  const pill = (text: string, onClick: () => void, active?: boolean) => (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs ${active ? "border-gray-400 bg-white/5" : "border-gray-700 text-gray-300 hover:bg-white/5"}`}
    >{text}</button>
  );

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
          {pill("Insert sample", insertSample)}
          {pill("Clear all", () => { setBasics(""); setHighlights(""); setLocation(""); setRules(""); })}
          <span className="ml-auto text-xs text-gray-400">{charCount}/{MIN_CHARS}+ chars</span>
        </div>

        {/* Quality meter */}
        <div className="rounded-lg border border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Quality check</span>
            <span className="text-sm text-gray-400">Score: {q.score}/100</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-gray-800/50">
            <div
              className={`h-full ${q.score > 80 ? "bg-emerald-500" : q.score > 60 ? "bg-amber-400" : "bg-rose-500"}`}
              style={{ width: `${q.score}%` }}
            />
          </div>
          {q.reasons.length ? (
            <ul className="mt-2 list-disc pl-5 text-xs text-gray-400">
              {q.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          ) : null}
        </div>

        {field("Basics", basics, setBasics, "Beds/baths, layout, amenities, capacity, parking, Wi-Fi…")}
        {field("Highlights", highlights, setHighlights, "Unique touches: view, hot tub, fire pit, espresso machine…")}
        {field("Location", location, setLocation, "Walking times, nearby attractions, neighborhood vibe…")}
        {field("House rules", rules, setRules, "Quiet hours, no parties, pets, smoking…")}

        {/* Options */}
        <div className="rounded-lg border border-gray-700 p-4 space-y-4">
          <h3 className="font-medium">Options</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-300">Tone</label>
              <select value={opt.tone} onChange={(e)=>setOptField("tone", e.target.value)} className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm">
                {["Warm & professional","Friendly & upbeat","Calm & minimalist","Luxury, refined","Family-friendly"].map(t=>(
                  <option key={t} value={t} className="bg-black">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-300">Audience</label>
              <select value={opt.audience} onChange={(e)=>setOptField("audience", e.target.value)} className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm">
                {["Families & small groups","Couples & business travelers","Remote workers","Adventure travelers","Long-term stays"].map(t=>(
                  <option key={t} value={t} className="bg-black">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-300">
                Word budget: <span className="text-gray-400">{opt.wordBudget} words</span>
              </label>
              <input type="range" min={120} max={260} step={10} value={opt.wordBudget}
                     onChange={(e)=>setOptField("wordBudget", parseInt(e.target.value))}
                     className="w-full"/>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-300">Language</label>
              <select value={opt.language} onChange={(e)=>setOptField("language", e.target.value)} className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm">
                {["English","Spanish","French","German","Portuguese","Italian","Japanese","Chinese"].map(t=>(
                  <option key={t} value={t} className="bg-black">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-300">Platform style</label>
              <select value={opt.platform} onChange={(e)=>setOptField("platform", e.target.value as any)} className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm">
                {["Airbnb","VRBO","Booking"].map(t=>(
                  <option key={t} value={t} className="bg-black">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-300">Season</label>
              <select value={opt.season} onChange={(e)=>setOptField("season", e.target.value as any)} className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm">
                {["Default","Spring","Summer","Fall","Winter"].map(t=>(
                  <option key={t} value={t} className="bg-black">{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-300">Units</label>
              <select value={opt.unit} onChange={(e)=>setOptField("unit", e.target.value as any)} className="w-full rounded-md border border-gray-700 bg-transparent px-3 py-2 text-sm">
                {["imperial","metric"].map(t=>(
                  <option key={t} value={t} className="bg-black">{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={opt.includeTitle} onChange={(e)=>setOptField("includeTitle", e.target.checked)} /> Title</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={opt.includeHighlights} onChange={(e)=>setOptField("includeHighlights", e.target.checked)} /> Highlights</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={opt.includeCaption} onChange={(e)=>setOptField("includeCaption", e.target.checked)} /> Social caption</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={opt.includeSEO} onChange={(e)=>setOptField("includeSEO", e.target.checked)} /> SEO</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={opt.includeSections} onChange={(e)=>setOptField("includeSections", e.target.checked)} /> Airbnb sections</label>
          </div>
        </div>

        {/* CTA row */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onGenerate} disabled={disableGen}
                  className="rounded-md border border-gray-600 px-4 py-2 text-sm disabled:opacity-50">
            {state === "loading" ? "Generating…" : "Generate"}
          </button>
          {err && <span className="text-sm text-rose-400">{err}</span>}
          {!err && state === "done" && <span className="text-sm text-emerald-400">Done — see results →</span>}
        </div>

        {/* Version history */}
        {history.length > 0 && (
          <div className="rounded-lg border border-gray-700 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">Version history</h3>
              <button className="text-xs text-gray-400 underline" onClick={()=>setHistory([])}>Clear</button>
            </div>
            <ul className="space-y-2">
              {history.map((v, i)=>(
                <li key={v.when} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-gray-300">{new Date(v.when).toLocaleTimeString()} • {v.options.tone} • {v.options.wordBudget}w</span>
                  <button className="rounded-md border border-gray-700 px-2 py-1 text-xs"
                          onClick={()=>{ setRes(v.result); setOpt(v.options); }}>
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* RIGHT: RESULTS */}
      <section ref={rightRef} className="rounded-lg border border-gray-700 p-4 md:sticky md:top-6 h-fit">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(["description","titles","highlights","sections","social","seo"] as TabKey[]).map(k=>(
            <button key={k} onClick={()=>setActive(k)}
              className={`rounded-md px-3 py-1.5 text-sm ${active===k ? "border border-gray-500 bg-white/5" : "text-gray-300 hover:bg-white/5"}`}>
              {label(k)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={copyAllForAirbnb} className="rounded-md border border-gray-600 px-2 py-1 text-xs">
              {copied==="all" ? "Copied!" : "Copy All for Airbnb"}
            </button>
            <button onClick={exportJSON} className="rounded-md border border-gray-600 px-2 py-1 text-xs">Export JSON</button>
          </div>
        </div>

        {state === "loading" && (
          <div className="animate-pulse space-y-2">
            <div className="h-4 rounded bg-gray-800/50" />
            <div className="h-4 w-5/6 rounded bg-gray-800/50" />
            <div className="h-4 w-4/6 rounded bg-gray-800/50" />
            <div className="h-4 w-2/6 rounded bg-gray-800/50" />
          </div>
        )}

        {state === "idle" && (
          <p className="text-sm text-gray-500">Your results will appear here after you generate.</p>
        )}

        {state === "error" && (
          <p className="text-sm text-rose-400">{err || "Something went wrong."}</p>
        )}

        {state === "done" && (
          <div className="space-y-4">
            {active === "description" && (
              <Block
                title="Description"
                body={res.description || ""}
                onCopy={()=>copy(res.description,"desc")}
                onDownload={()=>download(res.description,"description.txt")}
                onRefine={(t)=>onRegenerate("description",t)}
                copied={copied==="desc"}
                refineOptions={["Shorter","Longer","More family-focused","More luxury","More minimalist","Tighten language"]}
              />
            )}

            {active === "titles" && (
              <TitlesBlock
                titles={res.titles || []}
                platform={opt.platform}
                onCopy={()=>copy(res.titles,"titles")}
                onDownload={()=>download(res.titles,"titles.txt")}
                onRegenerate={()=>onRegenerate("titles")}
                copied={copied==="titles"}
              />
            )}

            {active === "highlights" && (
              <ListBlock
                title="Highlights"
                items={res.highlights || []}
                onCopy={()=>copy(res.highlights,"hl")}
                onDownload={()=>download(res.highlights,"highlights.txt")}
                onRegenerate={()=>onRegenerate("highlights")}
                copied={copied==="hl"}
              />
            )}

            {active === "sections" && (
              <SectionsBlock
                sections={res.sections || {}}
                onCopy={()=>copy(res.sections,"sections")}
                onDownload={()=>download(res.sections,"airbnb-sections.txt")}
                onRegenerate={()=>onRegenerate("sections")}
                copied={copied==="sections"}
              />
            )}

            {active === "social" && (
              <SocialBlock
                social={res.social || {}}
                onCopy={()=>copy([res.social?.x || "", res.social?.instagram || ""].filter(Boolean),"social")}
                onDownload={()=>download([res.social?.x || "", res.social?.instagram || ""].filter(Boolean),"social.txt")}
                onRegenerate={()=>onRegenerate("social")}
                copied={copied==="social"}
              />
            )}

            {active === "seo" && (
              <ListBlock
                title="SEO tags"
                items={res.seo || []}
                onCopy={()=>copy(res.seo,"seo")}
                onDownload={()=>download(res.seo,"seo-tags.txt")}
                onRegenerate={()=>onRegenerate("seo")}
                copied={copied==="seo"}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function label(k: TabKey) {
  switch (k) {
    case "description": return "Description";
    case "titles": return "Titles";
    case "highlights": return "Highlights";
    case "sections": return "Sections";
    case "social": return "Social";
    case "seo": return "SEO";
  }
}

function Block(props: {
  title: string;
  body: string;
  onCopy: () => void;
  onDownload: () => void;
  onRefine?: (tweak: string) => void;
  refineOptions?: string[];
  copied: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium">{props.title}</h4>
        <div className="flex items-center gap-2">
          {props.refineOptions?.length ? (
            <select
              className="rounded-md border border-gray-700 bg-transparent px-2 py-1 text-xs"
              onChange={(e) => e.target.value && props.onRefine?.(e.target.value)}
              defaultValue=""
            >
              <option value="" className="bg-black">Refine…</option>
              {props.refineOptions.map(o => <option key={o} value={o} className="bg-black">{o}</option>)}
            </select>
          ) : null}
          <button onClick={props.onCopy} className="rounded-md border border-gray-600 px-2 py-1 text-xs">
            {props.copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={props.onDownload} className="rounded-md border border-gray-600 px-2 py-1 text-xs">Download</button>
        </div>
      </div>
      <article className="leading-7 text-gray-100">
        {props.body
          ? props.body.split("\n\n").map((p, i) => <p key={i} className="mb-2">{p}</p>)
          : <p className="text-sm text-gray-500">No content generated.</p>}
      </article>
    </div>
  );
}

function TitlesBlock(props: {
  titles: string[];
  platform: "Airbnb" | "VRBO" | "Booking";
  onCopy: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  copied: boolean;
}) {
  const limit = props.platform === "Airbnb" ? 32 : props.platform === "VRBO" ? 60 : 70;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Title (A/B/C)</h4>
        <div className="flex items-center gap-2">
          <button onClick={props.onRegenerate} className="rounded-md border border-gray-600 px-2 py-1 text-xs">Regenerate</button>
          <button onClick={props.onCopy} className="rounded-md border border-gray-600 px-2 py-1 text-xs">
            {props.copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={props.onDownload} className="rounded-md border border-gray-600 px-2 py-1 text-xs">Download</button>
        </div>
      </div>
      {props.titles.length ? (
        <ul className="space-y-2">
          {props.titles.map((t, i)=>(
            <li key={i} className="rounded-md border border-gray-700 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{t}</span>
                <span className={`text-xs ${t.length > limit ? "text-amber-400" : "text-gray-400"}`}>{t.length}/{limit}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-gray-500">No titles generated.</p>}
      <p className="text-xs text-gray-400">Tip: Airbnb truncates around ~32 characters—favor concrete hooks.</p>
    </div>
  );
}

function ListBlock(props: {
  title: string;
  items: string[];
  onCopy: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  copied: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{props.title}</h4>
        <div className="flex items-center gap-2">
          <button onClick={props.onRegenerate} className="rounded-md border border-gray-600 px-2 py-1 text-xs">Regenerate</button>
          <button onClick={props.onCopy} className="rounded-md border border-gray-600 px-2 py-1 text-xs">
            {props.copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={props.onDownload} className="rounded-md border border-gray-600 px-2 py-1 text-xs">Download</button>
        </div>
      </div>
      {props.items.length ? (
        <ul className="list-disc pl-5 leading-7 text-gray-100">
          {props.items.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      ) : <p className="text-sm text-gray-500">No items generated.</p>}
    </div>
  );
}

function SectionsBlock(props: {
  sections: Sections;
  onCopy: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  copied: boolean;
}) {
  const { space, access, notes } = props.sections || {};
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Airbnb sections</h4>
        <div className="flex items-center gap-2">
          <button onClick={props.onRegenerate} className="rounded-md border border-gray-600 px-2 py-1 text-xs">Regenerate</button>
          <button onClick={props.onCopy} className="rounded-md border border-gray-600 px-2 py-1 text-xs">{props.copied ? "Copied!" : "Copy"}</button>
          <button onClick={props.onDownload} className="rounded-md border border-gray-600 px-2 py-1 text-xs">Download</button>
        </div>
      </div>
      <article className="space-y-3 leading-7 text-gray-100">
        <div>
          <h5 className="font-medium">The Space</h5>
          <p className="text-gray-100">{space || "—"}</p>
        </div>
        <div>
          <h5 className="font-medium">Guest Access</h5>
          <p className="text-gray-100">{access || "—"}</p>
        </div>
        <div>
          <h5 className="font-medium">Other Things to Note</h5>
          <p className="text-gray-100">{notes || "—"}</p>
        </div>
      </article>
    </div>
  );
}

function SocialBlock(props: {
  social: { x?: string; instagram?: string };
  onCopy: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  copied: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Social captions</h4>
        <div className="flex items-center gap-2">
          <button onClick={props.onRegenerate} className="rounded-md border border-gray-600 px-2 py-1 text-xs">Regenerate</button>
          <button onClick={props.onCopy} className="rounded-md border border-gray-600 px-2 py-1 text-xs">
            {props.copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={props.onDownload} className="rounded-md border border-gray-600 px-2 py-1 text-xs">Download</button>
        </div>
      </div>
      <div className="space-y-2">
        <div className="rounded-md border border-gray-700 p-2">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
            <span>X (≤180)</span><span>{props.social.x?.length ?? 0}/180</span>
          </div>
          <p className="text-gray-100">{props.social.x || "—"}</p>
        </div>
        <div className="rounded-md border border-gray-700 p-2">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
            <span>Instagram</span><span>{props.social.instagram?.length ?? 0}</span>
          </div>
          <p className="text-gray-100">{props.social.instagram || "—"}</p>
        </div>
      </div>
    </div>
  );
}
