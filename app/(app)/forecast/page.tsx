import { ComingSoon } from "@/components/ComingSoon";
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
        <ComingSoon phase={2} what="Your forecast (sign in and add your birth details first)" />
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
