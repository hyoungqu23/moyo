import { and, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const rows = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.userId, userId),
          isNotNull(attempts.deletedAt),
          gt(attempts.deletedAt, sql`NOW() - INTERVAL '30 days'`),
        ),
      )
      .orderBy(desc(attempts.deletedAt));
    return NextResponse.json({ attempts: rows });
  } catch (error) {
    return jsonError(error);
  }
}
