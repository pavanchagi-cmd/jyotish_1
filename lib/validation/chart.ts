import { z } from "zod";

export const chartImageQuerySchema = z.object({
  style: z.enum(["north", "south"]).default("north"),
  div: z.enum(["D1", "D9", "moon"]).default("D1"),
});

export const chartPdfQuerySchema = z.object({
  style: z.enum(["north", "south"]).default("north"),
});
