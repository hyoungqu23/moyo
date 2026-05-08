import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { allowedUsers } from "@/db/schema";
import { HttpError } from "@/lib/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireAuth(_request: NextRequest) {
  if (process.env.NODE_ENV === "test" || process.env.MOYO_AUTH_BYPASS === "1") {
    return {
      userId:
        process.env.MOYO_TEST_USER_ID ?? "00000000-0000-0000-0000-000000000001",
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

  const [allowed] = await db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.email, user.email))
    .limit(1);

  if (!allowed) {
    throw new HttpError(403, "This email is not allowed");
  }

  return { userId: user.id, email: user.email };
}
