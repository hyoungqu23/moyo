/**
 * DELETE /api/attempts/{id}/permanent — 휴지통에서 영구 삭제.
 *
 * soft delete 상태(deleted_at IS NOT NULL)인 Attempt만 hard delete.
 * attempt_step_notes는 FK CASCADE로 함께 삭제.
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

export async function DELETE(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id } = await ctx.params;
    uuidSchema.parse(id);

    const result = await db
      .delete(attempts)
      .where(
        and(
          eq(attempts.id, id),
          eq(attempts.userId, userId),
          isNotNull(attempts.deletedAt),
        ),
      )
      .returning({ id: attempts.id });

    if (result.length === 0) {
      return jsonError(
        "휴지통에 있는 시도 기록만 영구 삭제할 수 있어요.",
        "NOT_FOUND",
        404,
      );
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorToResponse(error);
  }
}
