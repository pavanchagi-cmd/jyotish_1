import { hasSupabaseEnv } from "@/lib/env";
import { safeNextPath } from "@/lib/safe-redirect";
import { GoogleSignInButton } from "./GoogleSignInButton";

export const metadata = { title: "Sign in · Jyotish" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const configured = hasSupabaseEnv();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col gap-5 px-5 pt-6 pb-8">
      <div className="font-heading text-[22px] font-bold text-accent">Jyotish</div>
      <div className="flex flex-col gap-1.5">
        <h1 className="m-0 font-heading text-[30px] leading-[1.15] font-bold">Welcome</h1>
        <p className="m-0 text-[15px] leading-normal text-muted">
          Sign in to save your birth details and see your Kundali, daily horoscope and Panchang.
        </p>
      </div>
      {error ? (
        <p role="alert" className="rounded-[14px] border border-warm-border bg-warm-surface px-4 py-3 text-sm text-warm-soft">
          Sign-in did not finish. Please try again.
        </p>
      ) : null}
      {configured ? (
        <GoogleSignInButton next={safeNextPath(next)} />
      ) : (
        <p className="rounded-[14px] border border-border bg-surface px-4 py-3 text-sm text-muted">
          Sign-in is not configured yet. Add the Supabase environment variables to enable it.
        </p>
      )}
    </main>
  );
}
