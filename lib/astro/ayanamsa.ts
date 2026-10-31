import { e_tilt, MakeTime, type AstroTime } from "astronomy-engine";

/**
 * Lahiri (Chitrapaksha) ayanamsa.
 *
 * Definition (Indian Calendar Reform Committee, 1955): 23°15′00.658″ on
 * 21 March 1956, 0h TT (JD 2435553.5). That value includes nutation; the mean
 * value is 16.77″ (0.004658035°) less — the same reference epoch and value
 * Swiss Ephemeris uses for SE_SIDM_LAHIRI.
 * Precession from the epoch uses the IAU 2006 general precession in longitude
 * p_A (Capitaine et al. 2003, A&A 412, 567, eq. 39).
 *
 * TODO(verify): compare against Drik Panchang values once the owner's golden
 * charts arrive (tests/golden).
 */
const LAHIRI_EPOCH_JD = 2435553.5;
const LAHIRI_MEAN_AT_EPOCH = 23.250182778 - 0.004658035;
const J2000_JD = 2451545.0;

/** IAU 2006 general precession in longitude, arcseconds; T in Julian centuries TT from J2000. */
export function generalPrecessionArcsec(T: number): number {
  return 5028.796195 * T + 1.1054348 * T ** 2 + 0.00007964 * T ** 3 - 0.000023857 * T ** 4 - 0.0000000383 * T ** 5;
}

const T_EPOCH = (LAHIRI_EPOCH_JD - J2000_JD) / 36525;

/** Mean Lahiri ayanamsa in degrees (relative to the mean equinox of date). */
export function lahiriMean(time: AstroTime): number {
  const T = time.tt / 36525;
  return LAHIRI_MEAN_AT_EPOCH + (generalPrecessionArcsec(T) - generalPrecessionArcsec(T_EPOCH)) / 3600;
}

/** True Lahiri ayanamsa (adds nutation in longitude) — subtract from true-of-date longitudes. */
export function lahiriTrue(time: AstroTime): number {
  return lahiriMean(time) + e_tilt(time).dpsi / 3600;
}

export function ayanamsaAt(date: Date): { mean: number; true: number } {
  const t = MakeTime(date);
  return { mean: lahiriMean(t), true: lahiriTrue(t) };
}
