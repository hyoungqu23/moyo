import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { attempts } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { id } = await params;
    await db
      .delete(attempts)
      .where(and(eq(attempts.id, id), eq(attempts.userId, userId)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
