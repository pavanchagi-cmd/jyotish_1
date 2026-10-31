import { ComingSoon } from "@/components/ComingSoon";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "My Kundali · Jyotish" };

export default function KundaliPage() {
  return (
    <>
      <PageHeader title="My Kundali" />
      <ComingSoon phase={4} what="Your chart, planets and houses" />
    </>
  );
}
