/**
 * PATCH / DELETE /api/recipes/{id}/sources/{sourceId}
 *
 * DELETE: soft delete (deleted_at). 연결된 Recipe·Attempt 보존.
 */

import { and, eq, isNull } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { recipeSources } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { NotFoundError, requireRecipeOwnership } from "@/lib/recipes/ownership";
import { sourcePatchSchema, uuidSchema } from "@/lib/validators";

interface Params {
  params: Promise<{ id: string; sourceId: string }>;
}

async function ensureSource(sourceId: string, recipeId: string) {
  const [row] = await db
    .select()
    .from(recipeSources)
    .where(
      and(
        eq(recipeSources.id, sourceId),
        eq(recipeSources.recipeId, recipeId),
        isNull(recipeSources.deletedAt),
      ),
    )
    .limit(1);
  if (!row) throw new NotFoundError("Source");
  return row;
}

export async function PATCH(request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: recipeId, sourceId } = await ctx.params;
    uuidSchema.parse(recipeId);
    uuidSchema.parse(sourceId);

    await requireRecipeOwnership(recipeId, userId);
    await ensureSource(sourceId, recipeId);
    const input = sourcePatchSchema.parse(await request.json());

    const patch: Record<string, unknown> = {};
    if (input.type !== undefined) patch.type = input.type;
    if ("url" in input) patch.url = input.url ?? null;
    if ("rawContent" in input) patch.rawContent = input.rawContent ?? null;
    if ("youtubeVideoId" in input) patch.youtubeVideoId = input.youtubeVideoId ?? null;
    if ("title" in input) patch.title = input.title ?? null;
    if ("channel" in input) patch.channel = input.channel ?? null;
    if ("thumbnailUrl" in input) patch.thumbnailUrl = input.thumbnailUrl ?? null;
    if ("publishedAt" in input) patch.publishedAt = input.publishedAt ?? null;

    const [updated] = await db
      .update(recipeSources)
      .set(patch)
      .where(
        and(eq(recipeSources.id, sourceId), eq(recipeSources.recipeId, recipeId)),
      )
      .returning();

    return Response.json({ source: updated });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: Params) {
  try {
    const { userId } = await requireAuth();
    const { id: recipeId, sourceId } = await ctx.params;
    uuidSchema.parse(recipeId);
    uuidSchema.parse(sourceId);

    await requireRecipeOwnership(recipeId, userId);
    await ensureSource(sourceId, recipeId);

    await db
      .update(recipeSources)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(recipeSources.id, sourceId), eq(recipeSources.recipeId, recipeId)),
      );

    return new Response(null, { status: 204 });
  } catch (error) {
    return errorToResponse(error);
  }
}
