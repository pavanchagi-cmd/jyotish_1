import { z } from "zod";
import { isValidDate, isValidTime, MIN_BIRTH_DATE } from "@/lib/time/resolve";
import { MAX_OFFSET_SECONDS, MIN_OFFSET_SECONDS } from "@/lib/time/offsets";

/** Shared between the onboarding form and the API (spec section 4 field rules). */

/** Latest allowed birth date: today in the furthest-ahead zone (UTC+14). */
export function maxBirthDate(now = new Date()): string {
  return new Date(now.getTime() + 14 * 3600 * 1000).toISOString().slice(0, 10);
}

export const dateSchema = z
  .string()
  .refine(isValidDate, "Enter a valid date.")
  .refine((d) => d >= MIN_BIRTH_DATE, "Date of birth must be on or after 1 Jan 1900.")
  .refine((d) => d <= maxBirthDate(), "Date of birth cannot be in the future.");

export const timeSchema = z.string().refine(isValidTime, "Enter a time as HH:mm.");

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const offsetChoiceSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("auto") }),
  z.object({ kind: z.literal("bombay") }),
  z.object({ kind: z.literal("calcutta") }),
  z.object({ kind: z.literal("custom"), seconds: z.number().int().min(MIN_OFFSET_SECONDS).max(MAX_OFFSET_SECONDS) }),
]);

export const genderSchema = z.enum(["female", "male", "other"]);
export const languageSchema = z.enum(["en", "hi", "kn"]);

export const profileInputSchema = z
  .object({
    fullName: z.string().trim().min(2, "Name must be at least 2 characters.").max(80, "Name must be at most 80 characters."),
    gender: genderSchema.nullable(),
    date: dateSchema,
    time: timeSchema.nullable(),
    timeKnown: z.boolean(),
    place: coordinatesSchema.extend({ name: z.string().trim().min(1).max(200) }),
    offsetChoice: offsetChoiceSchema,
    language: languageSchema,
    /** Privacy consent (own data) or permission (someone else's data). Required to create a profile. */
    consent: z.boolean().optional(),
  })
  .refine((v) => !v.timeKnown || v.time !== null, { message: "Enter your time of birth.", path: ["time"] });

export type ProfileInput = z.infer<typeof profileInputSchema>;

export const resolveRequestSchema = coordinatesSchema.extend({
  date: dateSchema,
  time: timeSchema.nullable(),
});

export const placeQuerySchema = z.string().trim().min(2).max(100);
