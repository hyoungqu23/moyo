/**
 * POST /api/attempts/{id}/restore — soft delete 해제.
 */

import { and, eq, isNotNull } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { attempts } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse, jsonError } from "@/lib/http";
import { uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await ctx.params;
    uuidSchema.parse(id);

    const [updated] = await db
      .update(attempts)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(
        and(
          eq(attempts.id, id),
          eq(attempts.userId, userId),
          isNotNull(attempts.deletedAt),
        ),
      )
      .returning();

    if (!updated) {
      return jsonError("복구할 시도 기록을 찾지 못했어요.", "NOT_FOUND", 404);
    }
    return Response.json({ attempt: updated });
  } catch (error) {
    return errorToResponse(error);
  }
}
