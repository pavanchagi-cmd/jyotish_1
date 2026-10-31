import { Body, Ecliptic, GeoVector, MakeTime, type AstroTime } from "astronomy-engine";
import { lahiriMean, lahiriTrue } from "./ayanamsa";
import { diff180, norm360 } from "./math";
import type { Planet } from "./tables/planets";

const BODIES: Partial<Record<Planet, Body>> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mars: Body.Mars,
  Mercury: Body.Mercury,
  Jupiter: Body.Jupiter,
  Venus: Body.Venus,
  Saturn: Body.Saturn,
};

export interface PlanetPosition {
  /** Sidereal (Lahiri) longitude, degrees 0–360. */
  longitude: number;
  /** Tropical apparent longitude of date, degrees. */
  tropical: number;
  /** Degrees per day (sidereal). Negative = retrograde. */
  speed: number;
  retrograde: boolean;
}

/** Apparent geocentric tropical longitude, true equinox and ecliptic of date. */
function tropicalLongitude(body: Body, t: AstroTime): number {
  return Ecliptic(GeoVector(body, t, true)).elon;
}

/**
 * Mean lunar node (Rahu), tropical, mean equinox of date.
 * Meeus, "Astronomical Algorithms" 2nd ed., eq. 47.7.
 */
export function meanNodeTropical(t: AstroTime): number {
  const T = t.tt / 36525;
  return norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T ** 2 + T ** 3 / 467441 - T ** 4 / 60616000);
}

function siderealAt(planet: Planet, t: AstroTime): { sid: number; trop: number } {
  if (planet === "Rahu" || planet === "Ketu") {
    const rahuTrop = meanNodeTropical(t);
    const trop = planet === "Rahu" ? rahuTrop : norm360(rahuTrop + 180);
    // Mean node is referred to the mean equinox, so subtract the mean ayanamsa.
    return { trop, sid: norm360(trop - lahiriMean(t)) };
  }
  const trop = tropicalLongitude(BODIES[planet]!, t);
  return { trop, sid: norm360(trop - lahiriTrue(t)) };
}

export function planetPosition(planet: Planet, date: Date): PlanetPosition {
  const t = MakeTime(date);
  const { sid, trop } = siderealAt(planet, t);
  // Central difference over ±6 hours for daily motion.
  const before = siderealAt(planet, t.AddDays(-0.25)).sid;
  const after = siderealAt(planet, t.AddDays(0.25)).sid;
  const speed = diff180(after, before) / 0.5;
  return {
    longitude: sid,
    tropical: trop,
    speed,
    // Rahu and Ketu (mean) always move backwards and are conventionally retrograde.
    retrograde: speed < 0,
  };
}

export function allPositions(date: Date): Record<Planet, PlanetPosition> {
  const planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"] as const;
  return Object.fromEntries(planets.map((p) => [p, planetPosition(p, date)])) as Record<Planet, PlanetPosition>;
}

/** Sidereal longitude only (cheaper; used by searches). */
export function siderealLongitude(planet: Planet, t: AstroTime): number {
  return siderealAt(planet, t).sid;
}
