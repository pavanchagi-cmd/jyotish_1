import { redirect } from "next/navigation";
import { BirthForm } from "@/components/onboarding/BirthForm";
import { getCurrentProfile } from "@/lib/profiles/current";

export const metadata = { title: "Your birth details · Jyotish" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ add?: string }> }) {
  const current = await getCurrentProfile();
  const addingPartner = (await searchParams).add === "partner";
  if (current.state === "ready" && !addingPartner) redirect("/");
  if (addingPartner && current.state !== "ready") redirect("/onboarding");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col gap-5 px-5 pt-6 pb-8">
      <div className="font-heading text-[22px] font-bold text-accent">Jyotish</div>
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-heading text-[30px] leading-[1.15] font-bold">
          {addingPartner ? "Partner’s birth details" : "Your birth details"}
        </h1>
        <p className="m-0 text-[15px] leading-normal text-muted">
          A Kundali is a picture of the sky at the exact moment you were born. The more accurate these details, the more
          accurate your readings.
        </p>
      </div>
      {current.state === "unconfigured" ? (
        <p className="m-0 rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-muted">
          Saving is not configured yet. Add the Supabase and database environment variables to enable it.
        </p>
      ) : null}
      {addingPartner ? <BirthForm redirectTo="/match" submitLabel="Save and match" forSomeoneElse /> : <BirthForm />}
    </main>
  );
}
