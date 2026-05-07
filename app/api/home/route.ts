import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";
import { getHomeData } from "@/lib/stats";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    return NextResponse.json(await getHomeData(userId));
  } catch (error) {
    return jsonError(error);
  }
}
