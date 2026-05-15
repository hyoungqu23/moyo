import { readFileSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

// drizzle-kit은 .env.local을 자동으로 읽지 않는다 (Next.js dev/build와 달리).
// 의존성 추가 없이 native fs로 .env.local을 process.env에 주입한다.
function loadEnvLocal() {
  try {
    const text = readFileSync(".env.local", "utf-8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const [, key, rawValue] = m;
      if (process.env[key]) continue; // shell이 명시 전달했으면 우선
      // 양 끝 따옴표 제거 (작은/큰 따옴표 모두)
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // .env.local 없음 — CI 등 다른 환경에서는 shell env 그대로 사용
  }
}
loadEnvLocal();

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
