import "server-only";
import { getDb } from "./index";
import { matches } from "./schema";
import type { MatchResult } from "@/lib/astro/matching";

export async function saveMatch(userId: string, girlProfileId: string, boyProfileId: string, result: MatchResult) {
  const [row] = await getDb()
    .insert(matches)
    .values({
      userId,
      profileA: girlProfileId,
      profileB: boyProfileId,
      scores: result.kootas,
      doshas: { ...result.doshas, manglik: result.manglik },
      total: result.total.toFixed(1),
    })
    .returning({ id: matches.id });
  return row!.id;
}
