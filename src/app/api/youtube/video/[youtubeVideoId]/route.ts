import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { jsonError } from "@/lib/errors";
import { getYoutubeVideo } from "@/lib/youtube";

type Params = { params: Promise<{ youtubeVideoId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await requireAuth(request);
    const { youtubeVideoId } = await params;
    return NextResponse.json(await getYoutubeVideo(youtubeVideoId, userId));
  } catch (error) {
    return jsonError(error);
  }
}
