import Link from "next/link";
import { deploymentEnvironment, missingRequiredEnv } from "@/lib/env";
import type { CurrentProfile } from "@/lib/profiles/current";

/**
 * Shown instead of chart content when there is no profile to show yet.
 * Explains exactly what is missing and links to the next step.
 */
export function GetStarted({ state }: { state: Exclude<CurrentProfile["state"], "ready"> }) {
  if (state === "unconfigured") {
    const missing = missingRequiredEnv();
    const env = deploymentEnvironment();
    return (
      <section aria-labelledby="setup-title" className="flex flex-col gap-2.5 rounded-card-lg border border-warm-border bg-warm-surface p-4">
        <h2 id="setup-title" className="m-0 text-base font-semibold text-warm-text">
          Setup needed: sign-in and database are not connected
        </h2>
        <p className="m-0 text-sm leading-normal text-warm-soft">
          Nobody can sign in or save birth details on this deployment yet. In Vercel → Project → Settings → Environment
          Variables, add the settings below{env ? <> for the <b>{env}</b> environment</> : null}, then redeploy. Sign-in and
          the birth details form then appear automatically.
        </p>
        <div className="text-sm text-warm-soft">
          Missing here:
          <ul className="mt-1 mb-0 pl-5">
            {missing.map((m) => (
              <li key={m}>
                <code>{m}</code>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/onboarding" className="flex min-h-11 items-center self-start text-sm font-semibold">
          Preview the birth details form
        </Link>
      </section>
    );
  }

  const signedOut = state === "signed-out";
  return (
    <section aria-labelledby="start-title" className="flex flex-col gap-2.5 rounded-card-lg border border-border bg-surface p-4">
      <h2 id="start-title" className="m-0 font-heading text-xl font-bold">
        {signedOut ? "Sign in to get started" : "Add your birth details"}
      </h2>
      <p className="m-0 text-sm leading-normal text-muted">
        {signedOut
          ? "Sign in with Google, then enter your name, date, time and place of birth to see your Kundali."
          : "Enter your name, date, time and place of birth to see your Kundali, dasha, matching and forecast."}
      </p>
      <Link
        href={signedOut ? "/login" : "/onboarding"}
        className="flex h-12 items-center justify-center rounded-[14px] bg-accent text-base font-semibold text-accent-ink no-underline hover:text-accent-ink"
      >
        {signedOut ? "Sign in" : "Enter birth details"}
      </Link>
    </section>
  );
}
