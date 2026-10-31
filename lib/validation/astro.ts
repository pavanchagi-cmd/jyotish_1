import { z } from "zod";
import { coordinatesSchema, dateSchema } from "./birth";

const num = (min: number, max: number) => z.coerce.number().min(min).max(max);

export const panchangQuerySchema = z.object({
  lat: num(-90, 90),
  lng: num(-180, 180),
  /** Local calendar date at the place; defaults to today there. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const reverseQuerySchema = z.object({ lat: num(-90, 90), lng: num(-180, 180) });

export const matchRequestSchema = z
  .object({ girlProfileId: z.uuid(), boyProfileId: z.uuid() })
  .refine((v) => v.girlProfileId !== v.boyProfileId, { message: "Choose two different profiles." });

export { coordinatesSchema, dateSchema };
