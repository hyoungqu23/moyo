-- v0.5 RLS 정책 — 방어선 (Defense in Depth).
--
-- 배경:
--   - 우리 Drizzle direct connection은 postgres.{project-ref} 유저로 접속 → BYPASSRLS.
--     RLS 정책을 켜도 server-side 쿼리는 그대로 통과.
--   - 그러나 NEXT_PUBLIC_SUPABASE_ANON_KEY는 클라이언트 번들에 노출됨.
--     공격자가 anon key + Supabase REST API로 직접 쿼리 시도 시,
--     RLS off면 다른 사용자 데이터 노출.
--   - RLS on + 정책으로 anon/authenticated 직접 접근을 차단한다.
--
-- 정책 규칙:
--   - user_id 컬럼이 있는 테이블: auth.uid() = user_id 직접 검사
--   - 하위 리소스 (recipe_ingredients 등): 상위 recipes.user_id 검사
--   - attempt_step_notes: 상위 attempts.user_id 검사
--   - youtube_cache: 공유 캐시지만 anon 직접 노출은 불필요 → RLS on + authenticated SELECT만 허용
--   - ingestion_cache / usage_counters: user_id 기준 격리

-- ─────────────────────────────────────────────────────────
-- Enable RLS on all 11 tables
-- ─────────────────────────────────────────────────────────
ALTER TABLE "dishes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recipe_ingredients" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recipe_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recipe_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "recipe_customizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attempt_step_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "youtube_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ingestion_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "usage_counters" ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────
-- user_id 직접 보유 테이블 — auth.uid() = user_id
-- ─────────────────────────────────────────────────────────
CREATE POLICY "dishes_owner_all"
  ON "dishes" FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recipes_owner_all"
  ON "recipes" FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "attempts_owner_all"
  ON "attempts" FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ingestion_cache_owner_all"
  ON "ingestion_cache" FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usage_counters_owner_all"
  ON "usage_counters" FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────
-- 하위 리소스 — 상위 recipes.user_id 통해 체크
-- (소유권 체인 — server-side ownership.ts와 동일 규칙을 DB layer에서 강제)
-- ─────────────────────────────────────────────────────────
CREATE POLICY "recipe_ingredients_owner_all"
  ON "recipe_ingredients" FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "recipes"
      WHERE "recipes".id = recipe_ingredients.recipe_id
        AND "recipes".user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "recipes"
      WHERE "recipes".id = recipe_ingredients.recipe_id
        AND "recipes".user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_steps_owner_all"
  ON "recipe_steps" FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "recipes"
      WHERE "recipes".id = recipe_steps.recipe_id
        AND "recipes".user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "recipes"
      WHERE "recipes".id = recipe_steps.recipe_id
        AND "recipes".user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_sources_owner_all"
  ON "recipe_sources" FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "recipes"
      WHERE "recipes".id = recipe_sources.recipe_id
        AND "recipes".user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "recipes"
      WHERE "recipes".id = recipe_sources.recipe_id
        AND "recipes".user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_customizations_owner_all"
  ON "recipe_customizations" FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "recipes"
      WHERE "recipes".id = recipe_customizations.recipe_id
        AND "recipes".user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "recipes"
      WHERE "recipes".id = recipe_customizations.recipe_id
        AND "recipes".user_id = auth.uid()
    )
  );

-- attempt_step_notes — attempts.user_id 통해 체크
CREATE POLICY "attempt_step_notes_owner_all"
  ON "attempt_step_notes" FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "attempts"
      WHERE "attempts".id = attempt_step_notes.attempt_id
        AND "attempts".user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "attempts"
      WHERE "attempts".id = attempt_step_notes.attempt_id
        AND "attempts".user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────
-- youtube_cache — 공유 캐시. anon 직접 노출 차단.
-- authenticated read 가능하나 우리 server는 BYPASSRLS로 어차피 통과.
-- 정책 없음 = anon 접근 시 0행. (필요 시 추후 SELECT 정책 추가)
-- ─────────────────────────────────────────────────────────
-- (정책 추가 안 함 — RLS enable만으로 anon 차단)
