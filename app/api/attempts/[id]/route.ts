import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";
import { attemptPatchSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;
    const input = attemptPatchSchema.parse(await request.json());
    const [attempt] = await db
      .update(attempts)
      .set({
        ...(input.rating !== undefined
          ? { rating: input.rating.toFixed(1) }
          : {}),
        ...(input.changes !== undefined ? { changes: input.changes } : {}),
        ...(input.improvementNote !== undefined
          ? { improvementNote: input.improvementNote }
          : {}),
        ...(input.triedAt !== undefined ? { triedAt: input.triedAt } : {}),
      })
      .where(and(eq(attempts.id, id), eq(attempts.userId, userId)))
      .returning();
    return NextResponse.json({ attempt });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;
    const [attempt] = await db
      .update(attempts)
      .set({ deletedAt: new Date() })
      .where(and(eq(attempts.id, id), eq(attempts.userId, userId)))
      .returning();
    return NextResponse.json({ attempt });
  } catch (error) {
    return jsonError(error);
  }
}
