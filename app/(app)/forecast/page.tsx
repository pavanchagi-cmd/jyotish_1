import { GetStarted } from "@/components/GetStarted";
import { Disclaimer } from "@/components/Disclaimer";
import { ForecastView } from "@/components/forecast/ForecastView";
import { PageHeader } from "@/components/PageHeader";
import { forecastYears } from "@/lib/llm/forecast";
import { getCurrentProfile } from "@/lib/profiles/current";

export const metadata = { title: "Your next 5 years · Jyotish" };

export default async function ForecastPage() {
  const current = await getCurrentProfile();
  const header = <PageHeader title="Your next 5 years" subtitle="Year by year, in plain language" />;
  if (current.state !== "ready") {
    return (
      <>
        {header}
        <GetStarted state={current.state} />
      </>
    );
  }
  return (
    <>
      {header}
      <ForecastView profileId={current.profile.id} years={forecastYears(new Date(), current.profile.tzIana)} lang={current.profile.language} />
      <Disclaimer />
    </>
  );
}
