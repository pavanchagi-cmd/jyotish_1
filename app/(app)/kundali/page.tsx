import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { ComingSoon } from "@/components/ComingSoon";
import { ChartExplanation } from "@/components/kundali/ChartExplanation";
import { Disclaimer } from "@/components/Disclaimer";
import { KundaliView } from "@/components/kundali/KundaliView";
import { getChart } from "@/lib/db/charts";
import { birthSummary } from "@/lib/profiles/describe";
import { getCurrentProfile } from "@/lib/profiles/current";

export const metadata = { title: "My Kundali · Jyotish" };

export default async function KundaliPage({ searchParams }: { searchParams: Promise<{ profile?: string }> }) {
  const current = await getCurrentProfile();
  if (current.state !== "ready") {
    return (
      <>
        <h1 className="m-0 font-heading text-[26px] font-bold">My Kundali</h1>
        <ComingSoon phase={2} what="Your Kundali (sign in and add your birth details first)" />
      </>
    );
  }

  const requested = z.uuid().safeParse((await searchParams).profile);
  const profileId = requested.success ? requested.data : current.profile.id;
  const result = await getChart(current.userId, profileId);
  if (!result) notFound();
  const { profile, chart } = result;
  const isSelf = profile.id === current.profile.id;

  return (
    <>
      <div className="flex items-center gap-2.5">
        <Link href="/" aria-label="Back" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-text">
          <ChevronLeft aria-hidden size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="m-0 font-heading text-[26px] font-bold">{isSelf ? "My Kundali" : `${profile.fullName.split(" ")[0]}’s Kundali`}</h1>
          <div className="truncate text-[13px] text-muted">
            {profile.fullName} · {birthSummary(profile)}
          </div>
        </div>
      </div>

      <KundaliView profileId={profile.id} chart={chart} />

      <ChartExplanation profileId={profile.id} lang={profile.language} />
      <Disclaimer />
    </>
  );
}
