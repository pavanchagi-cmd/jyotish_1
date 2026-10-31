import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Your birth details · Jyotish" };

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col gap-5 px-5 pt-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="font-heading text-[22px] font-bold text-accent">Jyotish</div>
        <div className="text-[13px] text-muted">Step 1 of 2</div>
      </div>
      <h1 className="m-0 font-heading text-[30px] leading-[1.15] font-bold">Your birth details</h1>
      <ComingSoon phase={2} what="The birth details form" />
    </main>
  );
}
