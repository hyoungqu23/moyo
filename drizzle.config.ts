import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  // v0.5 9테이블 + 보조 2테이블 (L67 신규 셋업).
  // Supabase의 auth.users 등 관리 테이블에 닿지 않도록 우리 앱 테이블로만 introspection 범위 제한.
  tablesFilter: [
    "dishes",
    "recipes",
    "recipe_ingredients",
    "recipe_steps",
    "recipe_sources",
    "recipe_customizations",
    "attempts",
    "attempt_step_notes",
    "youtube_cache",
    "ingestion_cache",
    "usage_counters",
  ],
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@127.0.0.1:54322/postgres",
  },
});
