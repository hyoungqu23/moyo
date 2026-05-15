/**
 * POST /api/recipes/{id}/attempts — Attempt 생성.
 *
 * 단일 트랜잭션: attempts + attempt_step_notes[].
 * L70: AttemptStepNote video_timestamp는 v0.5 항상 null (입력 zod에서 받지 않음).
 */

import type { NextRequest } from "next/server";

import { db } from "@/db";
import { attemptStepNotes, attempts } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { requireRecipeOwnership } from "@/lib/recipes/ownership";
import { attemptCreateSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: recipeId } = await ctx.params;
    uuidSchema.parse(recipeId);

    await requireRecipeOwnership(recipeId, userId);
    const input = attemptCreateSchema.parse(await request.json());

    const attempt = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(attempts)
        .values({
          recipeId,
          userId,
          rating: input.rating === undefined || input.rating === null ? null : input.rating.toFixed(1),
          changes: input.changes ?? null,
          improvementNote: input.improvementNote ?? null,
          triedAt: input.triedAt,
        })
        .returning();

      if (input.stepNotes.length > 0) {
        await tx.insert(attemptStepNotes).values(
          input.stepNotes.map((sn) => ({
            attemptId: created.id,
            recipeStepId: sn.recipeStepId ?? null,
            note: sn.note,
            // videoTimestamp는 v0.5 OOS — null only (L70)
          })),
        );
      }

      return created;
    });

    return Response.json({ attempt }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
