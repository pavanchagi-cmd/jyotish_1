import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Geolocation is needed for the Home screen Panchang (user's current location).
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  {
    key: "Content-Security-Policy",
    value: ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'", "form-action 'self'"].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // geo-tz reads its boundary data from disk at runtime; keep it out of the bundle.
  serverExternalPackages: ["geo-tz"],
  // Only the "all" dataset is used (lib/time/zone.ts); skip the other two (~40 MB).
  outputFileTracingExcludes: {
    "/api/**/*": ["./node_modules/geo-tz/data/timezones-1970.*", "./node_modules/geo-tz/data/timezones-now.*"],
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/geo-tz/data/timezones.geojson.*", "./data/places.json"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
