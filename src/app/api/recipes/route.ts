/**
 * POST /api/recipes — Ingestion Draft 확정 저장.
 *
 * 단일 트랜잭션: recipes + recipe_ingredients[] + recipe_steps[] + recipe_sources[].
 * 보안: requireAuth + Dish 소유권 검증.
 */

import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import {
  recipeIngredients,
  recipeSources,
  recipeSteps,
  recipes,
} from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { requireDishOwnership } from "@/lib/recipes/ownership";
import { recipeCreateSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const input = recipeCreateSchema.parse(body);

    await requireDishOwnership(input.dishId, userId);

    const recipe = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(recipes)
        .values({
          dishId: input.dishId,
          userId,
          title: input.title,
          servings: input.servings ?? null,
          description: input.description ?? null,
        })
        .returning();

      if (input.ingredients.length > 0) {
        await tx.insert(recipeIngredients).values(
          input.ingredients.map((ing, idx) => ({
            recipeId: created.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit ?? null,
            optional: ing.optional,
            displayOrder: idx,
          })),
        );
      }

      if (input.steps.length > 0) {
        await tx.insert(recipeSteps).values(
          input.steps.map((step, idx) => ({
            recipeId: created.id,
            displayOrder: idx,
            instruction: step.instruction,
            timerSeconds: step.timerSeconds ?? null,
            note: step.note ?? null,
          })),
        );
      }

      if (input.sources.length > 0) {
        await tx.insert(recipeSources).values(
          input.sources.map((src) => ({
            recipeId: created.id,
            type: src.type,
            url: src.url ?? null,
            rawContent: src.rawContent ?? null,
            youtubeVideoId: src.youtubeVideoId ?? null,
            title: src.title ?? null,
            channel: src.channel ?? null,
            thumbnailUrl: src.thumbnailUrl ?? null,
            publishedAt: src.publishedAt ?? null,
            fetchedAt: src.type === "youtube" || src.type === "blog" ? sql`now()` : null,
          })),
        );
      }

      return created;
    });

    return Response.json({ recipe }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
