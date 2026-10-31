import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { hasDatabase, jsonError, requireUser } from "@/lib/api/http";
import { deleteAllUserData } from "@/lib/db/account";
import { publicEnv, serverEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * DELETE /api/me — "Delete my data" (spec section 9, DPDP Act 2023).
 * Deletes everything stored for the user, then the sign-in account itself when
 * the service role key is configured, then signs out.
 */
export async function DELETE() {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  if (!hasDatabase()) return jsonError(503, "Not configured yet.");

  await deleteAllUserData(auth.userId);

  let accountDeleted = false;
  const serviceKey = serverEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    const admin = createAdminClient(publicEnv().NEXT_PUBLIC_SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
    const { error } = await admin.auth.admin.deleteUser(auth.userId);
    accountDeleted = !error;
    if (error) console.error("[me.delete] auth user not deleted:", error.message);
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ dataDeleted: true, accountDeleted });
}
