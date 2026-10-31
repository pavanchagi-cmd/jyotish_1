import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DeleteMyData } from "@/components/profile/DeleteMyData";
import { LanguagePicker } from "@/components/profile/LanguagePicker";
import { SavedProfiles } from "@/components/profile/SavedProfiles";
import { listProfiles } from "@/lib/db/profiles";
import { birthSummary } from "@/lib/profiles/describe";
import { getCurrentProfile } from "@/lib/profiles/current";
import { getUserEmail } from "@/lib/supabase/server";

export const metadata = { title: "Profile · Jyotish" };

export default async function ProfilePage() {
  const current = await getCurrentProfile();
  const back = (
    <div className="flex items-center gap-2.5">
      <Link href="/" aria-label="Back" className="flex size-11 items-center justify-center rounded-full bg-surface text-text">
        <ChevronLeft aria-hidden size={20} />
      </Link>
      <h1 className="m-0 font-heading text-[26px] font-bold">Profile</h1>
    </div>
  );
  if (current.state !== "ready") {
    return (
      <>
        {back}
        <p className="m-0 text-sm text-muted">Sign in and add your birth details to see your profile.</p>
      </>
    );
  }

  const [rows, email] = await Promise.all([listProfiles(current.userId), getUserEmail()]);
  const saved = rows.map((p) => ({ id: p.id, name: p.fullName, summary: birthSummary(p), isPrimary: p.isPrimary }));

  return (
    <>
      {back}
      {email ? <div className="text-sm text-muted">Signed in as {email}</div> : null}

      <section className="flex flex-col gap-1 rounded-card border border-border bg-surface px-4 py-3.5">
        <LanguagePicker initial={current.profile.language} />
      </section>

      <section aria-labelledby="saved-title" className="flex flex-col gap-1 rounded-card border border-border bg-surface px-4 py-3.5">
        <h2 id="saved-title" className="m-0 font-heading text-xl font-bold">
          Saved birth details
        </h2>
        <SavedProfiles profiles={saved} />
        <Link href="/onboarding?add=partner" className="flex min-h-11 items-center text-sm font-semibold">
          + Add someone
        </Link>
      </section>

      <div className="flex flex-wrap gap-x-4">
        <Link href="/privacy" className="flex min-h-11 items-center text-sm">
          Privacy notice
        </Link>
        <form action="/auth/signout" method="post">
          <button type="submit" className="min-h-11 text-sm text-accent">
            Sign out
          </button>
        </form>
      </div>

      <DeleteMyData />
    </>
  );
}
