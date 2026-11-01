import postgres from "postgres";
import { createAuthUser, resetDatabase } from "../integration/db";
import { TEST_USER_ID } from "./session";

/** Fresh schema plus one signed-in user with a primary profile (Jaipur, known time). */
export default async function globalSetup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Set TEST_DATABASE_URL (a throwaway Postgres; it is wiped).");
  await resetDatabase(url);
  await createAuthUser(url, TEST_USER_ID);
  const sql = postgres(url, { max: 1 });
  try {
    await sql`
      insert into profiles (user_id, full_name, gender, birth_local, birth_utc, time_known, place_name,
                            lat, lng, tz_iana, utc_offset_seconds, tz_confirmed, language, is_primary)
      values (${TEST_USER_ID}, 'Ananya Sharma', 'female', '1995-08-14T06:42', '1995-08-14T01:12:00Z', true,
              'Jaipur, Rajasthan, India', 26.9124, 75.7873, 'Asia/Kolkata', 19800, false, 'en', true)`;
  } finally {
    await sql.end();
  }
}
