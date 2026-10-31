import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/ComingSoon";
import { Disclaimer } from "@/components/Disclaimer";
import { DashaView } from "@/components/dasha/DashaView";
import { PageHeader } from "@/components/PageHeader";
import { dashaReport } from "@/lib/astro/dasha-summary";
import { getChart } from "@/lib/db/charts";
import { getCurrentProfile } from "@/lib/profiles/current";

export const metadata = { title: "Dasha & transits · Jyotish" };

export default async function DashaPage() {
  const current = await getCurrentProfile();
  const header = <PageHeader title="Dasha & transits" subtitle="Vimshottari dasha · which planet is “in charge” now" />;
  if (current.state !== "ready") {
    return (
      <>
        {header}
        <ComingSoon phase={2} what="Your dasha (sign in and add your birth details first)" />
      </>
    );
  }
  const result = await getChart(current.userId, current.profile.id);
  if (!result) notFound();
  // JSON round-trip: dates become ISO strings for the client component.
  const report = JSON.parse(JSON.stringify(dashaReport(result.chart, new Date())));

  return (
    <>
      {header}
      <DashaView profileId={current.profile.id} report={report} lang={current.profile.language} />
      <Disclaimer />
    </>
  );
}
