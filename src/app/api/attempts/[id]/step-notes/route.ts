/**
 * POST /api/attempts/{id}/step-notes — AttemptStepNote 추가 (L70).
 *
 * 보안: Attempt 소유권 체인 검증 (requireAttemptOwnership).
 * v0.5: videoTimestamp 입력 받지 않음 (zod에서 차단, 항상 null 저장).
 */

import type { NextRequest } from "next/server";

import { db } from "@/db";
import { attemptStepNotes } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { requireAttemptOwnership } from "@/lib/recipes/ownership";
import { stepNoteCreateSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: attemptId } = await ctx.params;
    uuidSchema.parse(attemptId);

    await requireAttemptOwnership(attemptId, userId);
    const input = stepNoteCreateSchema.parse(await request.json());

    const [created] = await db
      .insert(attemptStepNotes)
      .values({
        attemptId,
        recipeStepId: input.recipeStepId ?? null,
        note: input.note,
        // videoTimestamp: null (v0.5 OOS — 자동 캡처 다음 사이클)
      })
      .returning();

    return Response.json({ stepNote: created }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
