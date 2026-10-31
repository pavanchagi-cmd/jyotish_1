import { ComingSoon } from "@/components/ComingSoon";
import { firstName, getCurrentProfile } from "@/lib/profiles/current";

export default async function HomePage() {
  const current = await getCurrentProfile();
  const name = current.state === "ready" ? firstName(current.profile.fullName) : null;

  return (
    <>
      <div>
        <h1 className="m-0 font-heading text-[28px] font-bold">{name ? `Namaste, ${name}` : "Namaste"}</h1>
      </div>
      {current.state === "ready" && !current.profile.timeKnown ? (
        <p className="m-0 rounded-[14px] border border-warm-border bg-warm-surface px-4 py-3 text-sm text-warm-soft">
          Your birth time is missing, so readings use your Moon sign only.
        </p>
      ) : null}
      <ComingSoon phase={5} what="Your daily, weekly and monthly horoscope" />
      <ComingSoon phase={3} what="Today’s Panchang" />
    </>
  );
}
