import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts, steps } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { HttpError, jsonError } from "@/lib/errors";
import { stepInputSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;
    const input = stepInputSchema.parse(await request.json());
    const [attempt] = await db.select().from(attempts).where(and(eq(attempts.id, id), eq(attempts.userId, userId))).limit(1);
    if (!attempt) throw new HttpError(404, "Attempt not found");
    const [step] = await db
      .insert(steps)
      .values({ attemptId: id, note: input.note, videoTimestamp: input.videoTimestamp ?? null, userId })
      .returning();
    return NextResponse.json({ step }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
