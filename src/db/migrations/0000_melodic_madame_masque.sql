CREATE TABLE IF NOT EXISTS "allowed_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "allowed_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"rating" numeric(2, 1) NOT NULL,
	"changes" text,
	"improvement_note" text,
	"tried_at" date NOT NULL,
	"deleted_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"note" text NOT NULL,
	"video_timestamp" integer,
	"deleted_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dish_id" uuid NOT NULL,
	"youtube_video_id" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"channel" varchar(255) NOT NULL,
	"thumbnail_url" text NOT NULL,
	"published_at" timestamp with time zone,
	"thumbs" varchar(4),
	"is_hidden" boolean DEFAULT false NOT NULL,
	"is_unavailable_on_youtube" boolean DEFAULT false NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "youtube_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"results" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "youtube_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attempts" ADD CONSTRAINT "attempts_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "steps" ADD CONSTRAINT "steps_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_video_id_idx" ON "attempts" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_user_id_idx" ON "attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_deleted_at_idx" ON "attempts" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dishes_slug_user_idx" ON "dishes" USING btree ("slug","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "dishes_user_id_idx" ON "dishes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "steps_attempt_id_idx" ON "steps" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "steps_attempt_created_at_idx" ON "steps" USING btree ("attempt_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "videos_dish_id_idx" ON "videos" USING btree ("dish_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "videos_youtube_video_id_dish_idx" ON "videos" USING btree ("youtube_video_id","dish_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "youtube_cache_cache_key_idx" ON "youtube_cache" USING btree ("cache_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "youtube_cache_expires_at_idx" ON "youtube_cache" USING btree ("expires_at");