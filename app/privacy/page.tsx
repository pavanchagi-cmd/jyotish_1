import Link from "next/link";

export const metadata = { title: "Privacy notice · Jyotish" };

// TODO(owner): legal review for India's DPDP Act 2023, and add a contact email for privacy requests.
const SECTIONS: [string, string[]][] = [
  [
    "What we collect",
    [
      "Your Google sign-in email, used only to sign you in.",
      "Birth details you enter for yourself and anyone you add (such as a partner): name, gender, date, time and place of birth, and the time zone we work out from them.",
      "Your reading language, and simple usage counts used to limit how often readings are generated.",
    ],
  ],
  [
    "Why we use it",
    [
      "To calculate charts, Panchang, dasha, matching and forecasts.",
      "To write readings in simple words. For this we send only derived facts such as signs, houses and planet periods to Google Gemini — never your name, birth date, birth time or place.",
    ],
  ],
  [
    "Who processes it",
    [
      "Supabase stores your account and data. Vercel hosts the app. Google Gemini writes readings from derived facts.",
      "When you tap “Search” for a place, the text you typed is sent to OpenStreetMap Nominatim. When you tap “Use my current location”, your approximate location is sent to Nominatim to find the place name.",
      "We do not sell or share your data with anyone else.",
    ],
  ],
  [
    "Your choices",
    [
      "You can change your reading language, remove saved partner or family profiles, or delete all your data at any time from your Profile page.",
      "“Delete my data” removes your profiles, charts, matches and readings, and your sign-in account.",
    ],
  ],
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-app flex-col gap-4 px-5 pt-6 pb-10">
      <Link href="/" className="font-heading text-[22px] font-bold no-underline">
        Jyotish
      </Link>
      <h1 className="m-0 font-heading text-[28px] font-bold">Privacy notice</h1>
      <p className="m-0 text-[15px] leading-normal text-muted">
        Your birth details are personal data. This page explains, in plain words, what we keep and why.
      </p>
      {SECTIONS.map(([title, items]) => (
        <section key={title} className="flex flex-col gap-2 rounded-card border border-border bg-surface px-4 py-3.5">
          <h2 className="m-0 font-heading text-xl font-bold">{title}</h2>
          <ul className="m-0 flex flex-col gap-1.5 pl-5 text-sm leading-normal text-text-soft">
            {items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
