import { Suspense } from "react";
import { VideoDetailClient } from "@/app/video/[id]/VideoDetailClient";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <VideoDetailClient id={id} />
    </Suspense>
  );
}
