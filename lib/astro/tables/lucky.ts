import type { Planet } from "./planets";

/**
 * Lucky colour and number per planet (owner decision: computed, not from Gemini).
 * Colours: traditional Navagraha colours. Numbers: the planet–number pairing of
 * Chaldean/Cheiro numerology (1 Sun, 2 Moon, 3 Jupiter, 4 Rahu, 5 Mercury,
 * 6 Venus, 7 Ketu, 8 Saturn, 9 Mars).
 * TODO(verify): owner to confirm the colour names shown to users.
 */
export const LUCKY: Record<Planet, { colour: string; number: number }> = {
  Sun: { colour: "Orange", number: 1 },
  Moon: { colour: "White", number: 2 },
  Jupiter: { colour: "Yellow", number: 3 },
  Rahu: { colour: "Grey", number: 4 },
  Mercury: { colour: "Green", number: 5 },
  Venus: { colour: "Light pink", number: 6 },
  Ketu: { colour: "Brown", number: 7 },
  Saturn: { colour: "Dark blue", number: 8 },
  Mars: { colour: "Red", number: 9 },
};

/** Lord of each weekday (Sunday = 0), as in the vara names. */
export const VARA_LORD: readonly Planet[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
