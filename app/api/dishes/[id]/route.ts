import { and, eq, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { dishes, videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;
    const [{ videoCount }] = await db
      .select({ videoCount: sql<number>`COUNT(*)` })
      .from(videos)
      .where(and(eq(videos.dishId, id), eq(videos.userId, userId)));
    if (Number(videoCount) > 0) {
      throw new HttpError(
        422,
        "영상이 연결된 메뉴는 삭제할 수 없어요. 먼저 영상을 정리해주세요.",
      );
    }
    await db
      .delete(dishes)
      .where(and(eq(dishes.id, id), eq(dishes.userId, userId)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
