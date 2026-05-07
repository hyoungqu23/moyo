DROP INDEX IF EXISTS "videos_youtube_video_id_dish_idx";--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_youtube_video_id_dish_unique" UNIQUE("youtube_video_id","dish_id");