import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Your next 5 years · Jyotish" };

export default function ForecastPage() {
  return (
    <>
      <PageHeader title="Your next 5 years" />
      <ComingSoon phase={6} what="Your year-by-year forecast" />
    </>
  );
}
