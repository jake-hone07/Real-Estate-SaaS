// Lightweight quality/lint helpers used client-side

const CLICHES = [
  "nestled", "oasis", "cozy", "charming", "breathtaking", "hidden gem",
  "steps away", "centrally located", "tastefully decorated", "unforgettable"
];

const RISKY = [
  // broad "fair housing" sensitive phrases or risky claims
  "safe neighborhood", "perfect for children", "ideal for families only",
  "no kids", "christian", "church group", "women only", "men only",
  "disabled", "handicap", "lgbt", "senior", "student only", "drug-free"
];

export type QualityReport = {
  score: number;                 // 0..100
  reasons: string[];
  cliches: string[];
  risky: string[];
  missing: string[];
};

export function qualityReport(facts: string): QualityReport {
  const reasons: string[] = [];
  const missing: string[] = [];
  const trimmed = facts.trim();
  const len = trimmed.length;

  if (len < 140) reasons.push("Add more concrete details (≥140 chars).");
  if (!/bed|br|bedroom|studio/i.test(trimmed)) missing.push("Beds/Bedrooms");
  if (!/bath|ba|bathroom/i.test(trimmed)) missing.push("Baths");
  if (!/wifi|wi-fi/i.test(trimmed)) missing.push("Wi-Fi/Internet");
  if (!/park|parking|garage/i.test(trimmed)) missing.push("Parking");
  if (!/walk|min|minute|drive/i.test(trimmed)) missing.push("Walking/driving times");
  if (!/rule|quiet|party|pet|smok/i.test(trimmed)) missing.push("House rules");

  const cliches = CLICHES.filter(w => new RegExp(`\\b${escapeRe(w)}\\b`, "i").test(trimmed));
  const risky = RISKY.filter(w => new RegExp(`\\b${escapeRe(w)}\\b`, "i").test(trimmed));

  // crude scoring
  let score = 60;
  score += Math.min(20, Math.floor((len - 140) / 40) * 5); // more facts -> better
  score -= cliches.length * 4;
  score -= risky.length * 10;
  score -= missing.length * 4;
  score = Math.max(0, Math.min(100, score));

  if (missing.length) reasons.push(`Add: ${missing.join(", ")}.`);
  if (cliches.length) reasons.push(`Avoid clichés: ${cliches.join(", ")}.`);
  if (risky.length) reasons.push(`Reword sensitive phrases: ${risky.join(", ")}.`);

  return { score, reasons, cliches, risky, missing };
}

function escapeRe(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
