import { and, eq, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts, videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;
    const [{ attemptCount }] = await db
      .select({ attemptCount: sql<number>`COUNT(*)` })
      .from(attempts)
      .where(and(eq(attempts.videoId, id), eq(attempts.userId, userId)));
    if (Number(attemptCount) > 0) {
      throw new HttpError(
        422,
        "시도 기록이 있는 영상은 삭제할 수 없어요. 대신 숨김 처리해주세요.",
      );
    }
    await db
      .delete(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
