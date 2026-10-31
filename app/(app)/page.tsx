import Link from "next/link";
import { ComingSoon } from "@/components/ComingSoon";
import { PanchangCard } from "@/components/panchang/PanchangCard";
import { TodayLabel } from "@/components/TodayLabel";
import { SIGNS } from "@/lib/astro/tables/signs";
import { getChart } from "@/lib/db/charts";
import { initials } from "@/lib/format";
import { firstName, getCurrentProfile } from "@/lib/profiles/current";

const tiles = [
  { href: "/kundali", title: "My Kundali", sub: "Chart, planets, houses" },
  { href: "/match", title: "Kundali Milan", sub: "Match two charts" },
  { href: "/dasha", title: "Dasha & transits", sub: "Your current period" },
];

function Chip({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-surface px-3 py-1.5 text-[13px]">{children}</div>;
}

export default async function HomePage() {
  const current = await getCurrentProfile();
  const profile = current.state === "ready" ? current.profile : null;
  const chart = profile ? (await getChart(profile.userId, profile.id))?.chart : undefined;
  const sign = (i: number) => `${SIGNS[i]!.en} (${SIGNS[i]!.sa})`;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <TodayLabel />
          <h1 className="m-0 font-heading text-[28px] font-bold">{profile ? `Namaste, ${firstName(profile.fullName)}` : "Namaste"}</h1>
        </div>
        {profile ? (
          <div aria-hidden className="flex size-11 items-center justify-center rounded-full bg-warm-strong font-semibold text-warm-text">
            {initials(profile.fullName)}
          </div>
        ) : null}
      </div>

      {chart ? (
        <div className="flex flex-wrap gap-2">
          {chart.lagna ? <Chip>Lagna: {sign(chart.lagna.sign)}</Chip> : null}
          <Chip>Moon: {sign(chart.planets.Moon.sign)}</Chip>
          <Chip>Nakshatra: {chart.planets.Moon.nakshatra.name}</Chip>
        </div>
      ) : null}

      {profile && !profile.timeKnown ? (
        <p className="m-0 rounded-[14px] border border-warm-border bg-warm-surface px-4 py-3 text-sm text-warm-soft">
          Your birth time is missing, so readings use your Moon sign only.
        </p>
      ) : null}

      <ComingSoon phase={5} what="Your daily, weekly and monthly horoscope" />

      <PanchangCard
        fallback={
          profile
            ? { lat: profile.lat, lng: profile.lng, label: profile.placeName.split(",")[0]! }
            : { lat: 12.9716, lng: 77.5946, label: "Bengaluru" }
        }
      />

      <h2 className="mt-1 mb-0 font-heading text-[21px] font-bold">Explore your chart</h2>
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="flex flex-col gap-1 rounded-card border border-border bg-surface p-3.5 text-text no-underline hover:text-text">
            <span className="text-base font-semibold">{t.title}</span>
            <span className="text-[13px] text-muted">{t.sub}</span>
          </Link>
        ))}
        <Link href="/forecast" className="flex flex-col gap-1 rounded-card border border-warm-border bg-warm-strong p-3.5 no-underline">
          <span className="text-base font-semibold text-warm-text">5-year forecast</span>
          <span className="text-[13px] text-warm-soft">Year by year, simply</span>
        </Link>
      </div>
    </>
  );
}
