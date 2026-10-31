import { computeBirthInstant } from "@/lib/time/resolve";
import type { ProfileInput } from "@/lib/validation/birth";

/** Columns derived from validated input + the IANA zone for the place. */
export function profileColumns(input: ProfileInput, zone: string) {
  const time = input.timeKnown ? input.time : null;
  const instant = computeBirthInstant({ zone, date: input.date, time, choice: input.offsetChoice });
  return {
    fullName: input.fullName,
    gender: input.gender,
    birthLocal: instant.birthLocal,
    birthUtc: instant.birthUtc,
    timeKnown: input.timeKnown,
    placeName: input.place.name,
    lat: input.place.lat,
    lng: input.place.lng,
    tzIana: zone,
    utcOffsetSeconds: instant.utcOffsetSeconds,
    tzConfirmed: instant.tzConfirmed,
    language: input.language,
  };
}
