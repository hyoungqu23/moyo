CREATE TABLE "attempt_step_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"recipe_step_id" uuid,
	"note" text NOT NULL,
	"video_timestamp" integer,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempt_step_notes_video_timestamp_check" CHECK ("attempt_step_notes"."video_timestamp" IS NULL OR "attempt_step_notes"."video_timestamp" >= 0)
);
--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" numeric(2, 1),
	"changes" text,
	"improvement_note" text,
	"tried_at" date NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_cache" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"source_type" text NOT NULL,
	"draft" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_customizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"base_ingredient_id" uuid,
	"base_step_id" uuid,
	"diff_type" text NOT NULL,
	"diff_payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_customizations_diff_type_check" CHECK ("recipe_customizations"."diff_type" IN ('amount_adjust', 'step_note', 'swap', 'skip'))
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"name" text NOT NULL,
	"amount" text NOT NULL,
	"unit" text,
	"optional" boolean DEFAULT false NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"type" text NOT NULL,
	"url" text,
	"raw_content" text,
	"youtube_video_id" text,
	"title" text,
	"channel" text,
	"thumbnail_url" text,
	"published_at" timestamp with time zone,
	"is_unavailable_on_source" boolean DEFAULT false NOT NULL,
	"fetched_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "recipe_sources_type_check" CHECK ("recipe_sources"."type" IN ('youtube', 'blog', 'text', 'manual'))
);
--> statement-breakpoint
CREATE TABLE "recipe_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"display_order" integer NOT NULL,
	"instruction" text NOT NULL,
	"timer_seconds" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_steps_timer_seconds_check" CHECK ("recipe_steps"."timer_seconds" IS NULL OR "recipe_steps"."timer_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dish_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"servings" text,
	"description" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_counters" (
	"user_id" uuid NOT NULL,
	"month" text NOT NULL,
	"ingest_attempt_count" integer DEFAULT 0 NOT NULL,
	"ingest_draft_count" integer DEFAULT 0 NOT NULL,
	"ingest_save_count" integer DEFAULT 0 NOT NULL,
	"llm_call_count" integer DEFAULT 0 NOT NULL,
	"confidence_high_count" integer DEFAULT 0 NOT NULL,
	"confidence_med_count" integer DEFAULT 0 NOT NULL,
	"confidence_low_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "youtube_cache" (
	"cache_key" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempt_step_notes" ADD CONSTRAINT "attempt_step_notes_attempt_id_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_step_notes" ADD CONSTRAINT "attempt_step_notes_recipe_step_id_recipe_steps_id_fk" FOREIGN KEY ("recipe_step_id") REFERENCES "public"."recipe_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_customizations" ADD CONSTRAINT "recipe_customizations_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_customizations" ADD CONSTRAINT "recipe_customizations_base_ingredient_id_recipe_ingredients_id_fk" FOREIGN KEY ("base_ingredient_id") REFERENCES "public"."recipe_ingredients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_customizations" ADD CONSTRAINT "recipe_customizations_base_step_id_recipe_steps_id_fk" FOREIGN KEY ("base_step_id") REFERENCES "public"."recipe_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_sources" ADD CONSTRAINT "recipe_sources_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempt_step_notes_attempt_idx" ON "attempt_step_notes" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "attempts_recipe_idx" ON "attempts" USING btree ("recipe_id","deleted_at","tried_at");--> statement-breakpoint
CREATE INDEX "attempts_user_tried_at_idx" ON "attempts" USING btree ("user_id","tried_at");--> statement-breakpoint
CREATE INDEX "attempts_deleted_at_idx" ON "attempts" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "dishes_user_id_idx" ON "dishes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ingestion_cache_user_idx" ON "ingestion_cache" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recipe_customizations_recipe_idx" ON "recipe_customizations" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_ingredients_recipe_order_idx" ON "recipe_ingredients" USING btree ("recipe_id","display_order");--> statement-breakpoint
CREATE INDEX "recipe_sources_recipe_idx" ON "recipe_sources" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_steps_recipe_order_idx" ON "recipe_steps" USING btree ("recipe_id","display_order");--> statement-breakpoint
CREATE INDEX "recipes_dish_user_idx" ON "recipes" USING btree ("dish_id","user_id");--> statement-breakpoint
CREATE INDEX "recipes_user_archived_idx" ON "recipes" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_counters_pk" ON "usage_counters" USING btree ("user_id","month");--> statement-breakpoint
-- v0.5 PARTIAL UNIQUE (F4-3 / OQ9): Drizzle 미지원, raw SQL 수동 추가.
-- 동일 Recipe 동일 URL 중복 등록 방지. URL이 NULL인 Source(텍스트 직접 입력)는 제약 제외.
CREATE UNIQUE INDEX "recipe_sources_url_unique" ON "recipe_sources" ("recipe_id", "url") WHERE "url" IS NOT NULL;