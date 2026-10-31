/** Wraps to [0, 360). Leaves in-range values untouched so boundaries don't drift by rounding. */
export const norm360 = (x: number) => {
  if (x >= 0 && x < 360) return x;
  const r = x % 360;
  const w = r < 0 ? r + 360 : r;
  return w >= 360 ? 0 : w;
};
/** Signed difference a − b wrapped to (−180, 180]. */
export const diff180 = (a: number, b: number) => {
  const d = norm360(a - b);
  return d > 180 ? d - 360 : d;
};
export const signOf = (lon: number) => Math.floor(norm360(lon) / 30);
export const degInSign = (lon: number) => norm360(lon) % 30;
export const DEG = Math.PI / 180;
