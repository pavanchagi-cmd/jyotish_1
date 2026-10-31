import { GetStarted } from "@/components/GetStarted";
import { Disclaimer } from "@/components/Disclaimer";
import { MatchView, type MatchProfile } from "@/components/match/MatchView";
import { PageHeader } from "@/components/PageHeader";
import { SIGNS } from "@/lib/astro/tables/signs";
import { getChart } from "@/lib/db/charts";
import { listProfiles } from "@/lib/db/profiles";
import { getCurrentProfile } from "@/lib/profiles/current";

export const metadata = { title: "Kundali Milan · Jyotish" };

export default async function MatchPage() {
  const current = await getCurrentProfile();
  const header = <PageHeader title="Kundali Milan" subtitle="Ashtakoota guna matching for marriage" />;
  if (current.state !== "ready") {
    return (
      <>
        {header}
        <GetStarted state={current.state} />
      </>
    );
  }

  const rows = await listProfiles(current.userId);
  const profiles: MatchProfile[] = await Promise.all(
    rows.map(async (p) => {
      const chart = (await getChart(current.userId, p.id))!.chart;
      return {
        id: p.id,
        name: p.fullName,
        gender: p.gender,
        moon: `${SIGNS[chart.planets.Moon.sign]!.en} · ${chart.planets.Moon.nakshatra.name}`,
      };
    }),
  );

  return (
    <>
      {header}
      <MatchView profiles={profiles} />
      <Disclaimer />
    </>
  );
}
