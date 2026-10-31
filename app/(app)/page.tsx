import { ComingSoon } from "@/components/ComingSoon";

export default function HomePage() {
  return (
    <>
      <div>
        <h1 className="m-0 font-heading text-[28px] font-bold">Namaste</h1>
      </div>
      <ComingSoon phase={5} what="Your daily, weekly and monthly horoscope" />
      <ComingSoon phase={3} what="Today’s Panchang" />
    </>
  );
}
