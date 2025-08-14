"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GenerateClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const preset = sp.get("preset") || "";

  const [facts, setFacts] = useState(preset);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function onGenerate() {
    if (facts.trim().length < 120) {
      alert("Add a bit more detail (at least ~120 characters).");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts }),
      });
      const data = await res.json();
      setResult(data?.text || "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <textarea
        value={facts}
        onChange={(e) => setFacts(e.target.value)}
        className="w-full min-h-40 rounded-md border p-3"
        placeholder="Beds/baths, highlights, views, walking times, amenities, rules…"
      />
      <button onClick={onGenerate} disabled={loading} className="rounded-md border px-4 py-2 disabled:opacity-60">
        {loading ? "Generating…" : "Generate listing"}
      </button>
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/6" />
        </div>
      ) : result ? (
        <article className="space-y-3">
          {result.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
          <CopyBtn text={result} />
        </article>
      ) : (
        <p className="text-sm text-gray-500">Your listing will appear here.</p>
      )}
    </section>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
      className="mt-2 rounded-md border px-3 py-1.5 text-sm"
    >
      {ok ? "Copied!" : "Copy"}
    </button>
  );
}
