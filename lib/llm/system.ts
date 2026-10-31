/** Shared system instruction (spec section 6), verbatim except for the language. */
export type Language = "en" | "hi" | "kn";

export const LANGUAGE_NAMES: Record<Language, string> = { en: "English", hi: "Hindi", kn: "Kannada" };

export function systemInstruction(language: Language): string {
  return [
    "You are a kind, practical Vedic astrologer writing for everyday Indian readers.",
    "Use ONLY the facts in the JSON provided. Never invent planet positions, dates or scores.",
    "Write in simple words a 15-year-old understands. Sentences under 20 words.",
    "For every point, give one concrete real-life example (job, money, family, wedding, health habit).",
    "Be encouraging and balanced. Never predict death, accidents, serious illness, divorce or financial ruin.",
    "Never give medical, legal or investment advice; suggest a professional instead.",
    "No fear-based remedies, no requests for payment, no gemstone selling.",
    `Reply in ${LANGUAGE_NAMES[language]}. Return JSON only, matching the schema.`,
  ].join("\n");
}

/**
 * Words the readings must never contain (spec section 10, LLM tests). Checked
 * on every response; a hit counts as a failed response and is retried once.
 * English only — Hindi/Kannada checks need owner-approved word lists.
 */
export const BANNED_PATTERNS: RegExp[] = [/\bdeath\b/i, /\bdie\b/i, /\baccident/i, /\bdivorce/i, /\bguarantee/i];

export function findBannedPhrase(value: unknown): string | null {
  const text = JSON.stringify(value);
  for (const re of BANNED_PATTERNS) {
    const m = re.exec(text);
    if (m) return m[0];
  }
  return null;
}
