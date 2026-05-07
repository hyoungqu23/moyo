import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;
    const [attempt] = await db
      .update(attempts)
      .set({ deletedAt: null })
      .where(and(eq(attempts.id, id), eq(attempts.userId, userId)))
      .returning();
    return NextResponse.json({ attempt });
  } catch (error) {
    return jsonError(error);
  }
}
