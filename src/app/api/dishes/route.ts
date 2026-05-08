import { asc, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { dishes } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";
import { slugifyDishName } from "@/lib/slug";
import { dishInputSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const rows = await db
      .select()
      .from(dishes)
      .where(eq(dishes.userId, userId))
      .orderBy(asc(dishes.name));
    return NextResponse.json({ dishes: rows });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const input = dishInputSchema.parse(await request.json());
    const [dish] = await db
      .insert(dishes)
      .values({ name: input.name, slug: slugifyDishName(input.name), userId })
      .returning();
    return NextResponse.json({ dish }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
