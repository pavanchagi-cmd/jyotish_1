/**
 * Feature templates (spec section 6). Bump a feature's version whenever its
 * template changes, so cached readings regenerate.
 */
export const PROMPTS = {
  horoscope: {
    version: "horoscope-v1",
    instruction:
      "Write a horoscope for the period in the facts, for someone with the natal Moon sign (and Lagna, if given) in the facts. " +
      "Use the transits and their house numbers from the Moon and Lagna. " +
      "title: one short, encouraging headline. body: 2–4 sentences on what the period favours, naming the planet and house behind it. " +
      "example: one concrete everyday example, starting with \"Example:\".",
  },
  kundali: {
    version: "kundali-v1",
    instruction:
      "Explain this birth chart in simple words. " +
      "lagna: how others see the person (null if lagna is null). moon: mind and emotions from the Moon sign and nakshatra. " +
      "highlights: 2–4 notable placements from the facts (for example a planet in the 7th or 10th house), each with what it means and one real-life example.",
  },
  dasha: {
    version: "dasha-v1",
    instruction:
      "Explain the current Vimshottari period and the slow-moving transits. " +
      "currentPeriod.summary: what the mahadasha and antardasha lords bring now, in plain words. currentPeriod.example: one typical real-life example. " +
      "transits: one entry per transit in the facts (same planet and houseFromMoon), with a short, balanced meaning and practical advice. " +
      "If approximate is true, say gently that dates are approximate because the birth time is missing.",
  },
  match: {
    version: "match-v1",
    instruction:
      "Explain this Kundali Milan (Ashtakoota) result for a couple and their families. " +
      "verdict: 1–3 words (for example \"Good match\"). summary: 2–3 sentences on the total and what stands out. " +
      "kootaNotes: one note for each koota scoring below half of its maximum. " +
      "doshaNotes: one note for each dosha present (Bhakoot, Nadi, Manglik), with a calm meaning, an example and a practical tip. " +
      "Mention that many astrologers consider cancellations, and that a total of 18 or more is traditionally acceptable.",
  },
  forecast: {
    version: "forecast-v1",
    instruction:
      "Write the forecast for the one calendar year in the facts. " +
      "headline: the year in one short line. why: 1–2 sentences naming the dasha periods and planets behind the year, in plain words. " +
      "areas: career (10th house), finance (2nd and 11th), family (4th), health (6th and Lagna), marriage (7th). " +
      "For each area use the transits touching its houses and the running dasha lords: rating 1–5 (5 = most supportive), " +
      "label (one word such as Strong, Steady, Good, Favourable, Take care), summary (1–2 sentences), " +
      "example (one concrete real-life example starting with \"Example:\"), and tip (one practical tip). " +
      "Health must stay gentle and general: habits, rest and routine only.",
  },
} as const;

export type Feature = keyof typeof PROMPTS;
