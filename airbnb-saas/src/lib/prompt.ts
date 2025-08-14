export function buildListingPrompt(facts: string) {
  return [
    {
      role: "system",
      content:
        "You are an expert short-term rental copywriter. Write clear, friendly, sensory descriptions that drive bookings. Avoid clichés and overpromises. American English. 140–200 words. 2–4 short paragraphs. End with a soft call-to-action.",
    },
    {
      role: "user",
      content:
        `PROPERTY FACTS:\n${facts}\n\n` +
        "Constraints: No generic filler, no emoji, avoid repeating amenities. Start with a concrete benefit. Use natural language.",
    },
  ];
}
