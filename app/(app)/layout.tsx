import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getCurrentProfile } from "@/lib/profiles/current";

/** Mobile-first shell: 390px design, centred 480px column on larger screens. */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const current = await getCurrentProfile();
  if (current.state === "no-profile") redirect("/onboarding");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-app flex-col bg-bg">
      <main className="flex grow flex-col gap-4 px-5 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
