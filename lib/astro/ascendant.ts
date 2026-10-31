import { e_tilt, MakeTime, SiderealTime } from "astronomy-engine";
import { lahiriTrue } from "./ayanamsa";
import { DEG, norm360 } from "./math";

/**
 * Lagna (ascendant): the ecliptic degree rising on the eastern horizon.
 * RAMC from apparent sidereal time, true obliquity; standard formula
 * λ = atan2(cos RAMC, −(sin RAMC·cos ε + tan φ·sin ε)) (Meeus ch. 14 / 24).
 * Returns sidereal (Lahiri) and tropical longitudes in degrees.
 */
export function ascendant(date: Date, lat: number, lng: number): { longitude: number; tropical: number } {
  const t = MakeTime(date);
  const gastHours = SiderealTime(t);
  const ramc = norm360(gastHours * 15 + lng) * DEG;
  const eps = e_tilt(t).tobl * DEG;
  const phi = lat * DEG;
  const y = Math.cos(ramc);
  const x = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  const tropical = norm360(Math.atan2(y, x) / DEG);
  return { tropical, longitude: norm360(tropical - lahiriTrue(t)) };
}
