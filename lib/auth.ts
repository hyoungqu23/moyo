import { createServerClient } from "@supabase/ssr";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { allowedUsers } from "@/db/schema";
import { HttpError } from "@/lib/errors";

export async function requireAuth(_request: NextRequest) {
  if (process.env.NODE_ENV === "test" || process.env.MOYO_AUTH_BYPASS === "1") {
    return {
      userId:
        process.env.MOYO_TEST_USER_ID ?? "00000000-0000-0000-0000-000000000001",
      email: "test@example.com",
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user.email) {
    throw new HttpError(401, "Authentication required");
  }

  const [user] = await db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.email, session.user.email))
    .limit(1);

  if (!user) {
    throw new HttpError(403, "This email is not allowed");
  }

  return { userId: session.user.id, email: session.user.email };
}
