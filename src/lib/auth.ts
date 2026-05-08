import type { NextRequest } from "next/server";
import { HttpError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAuth(_request: NextRequest) {
  if (process.env.NODE_ENV === "test" || process.env.NAYO_AUTH_BYPASS === "1") {
    return {
      userId:
        process.env.NAYO_TEST_USER_ID ?? "00000000-0000-0000-0000-000000000001",
      email: "test@example.com",
    };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    throw new HttpError(401, "Authentication required");
  }

  // Whitelist removed — anyone who completes Google OAuth via Supabase Auth
  // is allowed in. Per-row tenancy is still enforced downstream by the
  // `WHERE user_id = userId` clause on every Drizzle query (the actual
  // security boundary in this app).
  return { userId: user.id, email: user.email };
}
