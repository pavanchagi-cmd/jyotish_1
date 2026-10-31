import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "Kundali Milan · Jyotish" };

export default function MatchPage() {
  return (
    <>
      <PageHeader title="Kundali Milan" />
      <ComingSoon phase={3} what="Ashtakoota guna matching" />
    </>
  );
}
