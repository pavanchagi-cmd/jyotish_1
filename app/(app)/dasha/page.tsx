import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Dasha & transits · Jyotish" };

export default function DashaPage() {
  return (
    <>
      <PageHeader title="Dasha & transits" />
      <ComingSoon phase={3} what="Your dasha periods and current transits" />
    </>
  );
}
