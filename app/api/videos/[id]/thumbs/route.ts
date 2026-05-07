import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";
import { thumbSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;
    const input = thumbSchema.parse(await request.json());
    const [video] = await db
      .update(videos)
      .set({ thumbs: input.thumbs })
      .where(and(eq(videos.id, id), eq(videos.userId, userId)))
      .returning();
    return NextResponse.json({ video });
  } catch (error) {
    return jsonError(error);
  }
}
