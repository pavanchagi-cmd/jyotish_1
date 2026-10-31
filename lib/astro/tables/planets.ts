export const PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] as const;
export type Planet = (typeof PLANETS)[number];

/** Seven visible grahas (used where Rahu/Ketu don't apply, e.g. sign lordship, friendship). */
export const SEVEN_GRAHAS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
export type Graha = (typeof SEVEN_GRAHAS)[number];

export const PLANET_NAMES: Record<Planet, { sa: string; short: string }> = {
  Sun: { sa: "Surya", short: "Su" },
  Moon: { sa: "Chandra", short: "Mo" },
  Mars: { sa: "Mangal", short: "Ma" },
  Mercury: { sa: "Budh", short: "Me" },
  Jupiter: { sa: "Guru", short: "Ju" },
  Venus: { sa: "Shukra", short: "Ve" },
  Saturn: { sa: "Shani", short: "Sa" },
  Rahu: { sa: "Rahu", short: "Ra" },
  Ketu: { sa: "Ketu", short: "Ke" },
};

/**
 * Natural (naisargika) friendships, BPHS ch. 3 ("Naisargika Maitri").
 * For each graha: who it treats as friend / neutral / enemy.
 */
export const NATURAL_FRIENDSHIP: Record<Graha, { friends: Graha[]; neutral: Graha[]; enemies: Graha[] }> = {
  Sun: { friends: ["Moon", "Mars", "Jupiter"], neutral: ["Mercury"], enemies: ["Venus", "Saturn"] },
  Moon: { friends: ["Sun", "Mercury"], neutral: ["Mars", "Jupiter", "Venus", "Saturn"], enemies: [] },
  Mars: { friends: ["Sun", "Moon", "Jupiter"], neutral: ["Venus", "Saturn"], enemies: ["Mercury"] },
  Mercury: { friends: ["Sun", "Venus"], neutral: ["Mars", "Jupiter", "Saturn"], enemies: ["Moon"] },
  Jupiter: { friends: ["Sun", "Moon", "Mars"], neutral: ["Saturn"], enemies: ["Mercury", "Venus"] },
  Venus: { friends: ["Mercury", "Saturn"], neutral: ["Mars", "Jupiter"], enemies: ["Sun", "Moon"] },
  Saturn: { friends: ["Mercury", "Venus"], neutral: ["Jupiter"], enemies: ["Sun", "Moon", "Mars"] },
};

export type Relation = "friend" | "neutral" | "enemy";

export function relation(of: Graha, toward: Graha): Relation {
  const r = NATURAL_FRIENDSHIP[of];
  if (r.friends.includes(toward)) return "friend";
  if (r.enemies.includes(toward)) return "enemy";
  return "neutral";
}
