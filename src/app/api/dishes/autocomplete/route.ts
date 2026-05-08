import { and, eq, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { dishes } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!query) return NextResponse.json({ dishes: [] });
    const rows = await db
      .select()
      .from(dishes)
      .where(
        and(
          eq(dishes.userId, userId),
          sql`LOWER(${dishes.name}) LIKE LOWER(${"%" + query + "%"})`,
        ),
      )
      .limit(8);
    return NextResponse.json({ dishes: rows });
  } catch (error) {
    return jsonError(error);
  }
}
