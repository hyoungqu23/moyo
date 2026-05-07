import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const allowedUsers = pgTable("allowed_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const dishes = pgTable(
  "dishes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 150 }).notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    slugUserIdx: index("dishes_slug_user_idx").on(t.slug, t.userId),
    userIdIdx: index("dishes_user_id_idx").on(t.userId),
  }),
);

export const videos = pgTable(
  "videos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dishId: uuid("dish_id")
      .notNull()
      .references(() => dishes.id, { onDelete: "cascade" }),
    youtubeVideoId: varchar("youtube_video_id", { length: 20 }).notNull(),
    title: text("title").notNull(),
    channel: varchar("channel", { length: 255 }).notNull(),
    thumbnailUrl: text("thumbnail_url").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    thumbs: varchar("thumbs", { length: 4 }),
    isHidden: boolean("is_hidden").notNull().default(false),
    isUnavailableOnYoutube: boolean("is_unavailable_on_youtube")
      .notNull()
      .default(false),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    dishIdIdx: index("videos_dish_id_idx").on(t.dishId),
    // youtubeVideoIdx 일반 인덱스 제거 — UNIQUE 제약이 자동으로 인덱스를 생성하므로 중복 불필요.
    videosYoutubeVideoIdDishUnique: unique(
      "videos_youtube_video_id_dish_unique",
    ).on(t.youtubeVideoId, t.dishId),
  }),
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    rating: numeric("rating", { precision: 2, scale: 1 }).notNull(),
    changes: text("changes"),
    improvementNote: text("improvement_note"),
    triedAt: date("tried_at").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    videoIdIdx: index("attempts_video_id_idx").on(t.videoId),
    userIdIdx: index("attempts_user_id_idx").on(t.userId),
    deletedAtIdx: index("attempts_deleted_at_idx").on(t.deletedAt),
  }),
);

export const steps = pgTable(
  "steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => attempts.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    videoTimestamp: integer("video_timestamp"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    attemptIdIdx: index("steps_attempt_id_idx").on(t.attemptId),
    attemptCreatedAtIdx: index("steps_attempt_created_at_idx").on(
      t.attemptId,
      t.createdAt,
    ),
  }),
);

export const youtubeCache = pgTable(
  "youtube_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cacheKey: text("cache_key").notNull().unique(),
    results: jsonb("results").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => ({
    cacheKeyIdx: index("youtube_cache_cache_key_idx").on(t.cacheKey),
    expiresAtIdx: index("youtube_cache_expires_at_idx").on(t.expiresAt),
  }),
);

export type Dish = typeof dishes.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type Step = typeof steps.$inferSelect;
