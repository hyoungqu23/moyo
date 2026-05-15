/**
 * GET / POST /api/dishes
 *
 * GET: 사용자 Dish 목록 (메뉴 페이지·검색 진입 보조).
 * POST: 신규 Dish 단독 생성 (Ingestion 외 별도 진입점, 사용자가 빈 Dish 부터 만들고 싶을 때).
 */

import { and, asc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db";
import { dishes } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { errorToResponse } from "@/lib/http";
import { dishCreateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const rows = await db
      .select()
      .from(dishes)
      .where(eq(dishes.userId, userId))
      .orderBy(asc(dishes.name));
    return Response.json({ dishes: rows });
  } catch (error) {
    return errorToResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const input = dishCreateSchema.parse(await request.json());

    // 같은 이름 Dish 있으면 재사용 (Ingestion resolveDishId와 동일 정책).
    const [existing] = await db
      .select()
      .from(dishes)
      .where(and(eq(dishes.userId, userId), eq(dishes.name, input.name)))
      .limit(1);
    if (existing) return Response.json({ dish: existing }, { status: 200 });

    const [created] = await db
      .insert(dishes)
      .values({ userId, name: input.name })
      .returning();
    return Response.json({ dish: created }, { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}
