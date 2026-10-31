import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { FullDayPanchang } from "@/components/panchang/FullDayPanchang";
import { getCurrentProfile } from "@/lib/profiles/current";
import { z } from "zod";

export const metadata = { title: "Panchang · Jyotish" };

const qSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  label: z.string().max(100).optional(),
});

export default async function PanchangPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const q = qSchema.safeParse(await searchParams);
  const current = await getCurrentProfile();
  const place = q.success
    ? { lat: q.data.lat, lng: q.data.lng, label: q.data.label ?? "Selected place" }
    : current.state === "ready"
      ? { lat: current.profile.lat, lng: current.profile.lng, label: current.profile.placeName.split(",")[0]! }
      : { lat: 12.9716, lng: 77.5946, label: "Bengaluru" };

  return (
    <>
      <div className="flex items-center gap-2.5">
        <Link href="/" aria-label="Back" className="flex size-11 items-center justify-center rounded-full bg-surface text-text">
          <ChevronLeft aria-hidden size={20} />
        </Link>
        <h1 className="m-0 font-heading text-[26px] font-bold">Panchang</h1>
      </div>
      <FullDayPanchang place={place} />
    </>
  );
}
