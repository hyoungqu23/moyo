import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/errors";
import { videoHiddenSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;
    const body = videoHiddenSchema.parse(
      await request.json().catch(() => ({})),
    );
    const [current] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .limit(1);
    if (!current) throw new HttpError(404, "Video not found");
    const [video] = await db
      .update(videos)
      .set({ isHidden: body.isHidden ?? !current.isHidden })
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .returning();
    return NextResponse.json({ video });
  } catch (error) {
    return jsonError(error);
  }
}
