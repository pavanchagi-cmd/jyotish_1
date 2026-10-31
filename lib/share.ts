import type { ChartData } from "@/lib/astro/chart";
import { SIGNS } from "@/lib/astro/tables/signs";

/**
 * WhatsApp share text. Shares only the sign summary and a link to the app —
 * never birth date, time or place (privacy; spec section 9).
 */
export function kundaliShareText(chart: ChartData, appUrl: string): string {
  const parts = [
    chart.lagna ? `Lagna ${SIGNS[chart.lagna.sign]!.en}` : null,
    `Moon ${SIGNS[chart.planets.Moon.sign]!.en}`,
    `Nakshatra ${chart.planets.Moon.nakshatra.name}`,
  ].filter(Boolean);
  return `I just made my Kundali on Jyotish: ${parts.join(", ")}. Make yours: ${appUrl}`;
}

export function whatsAppUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
