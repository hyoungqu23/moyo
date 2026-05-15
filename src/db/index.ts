/**
 * Drizzle DB 커넥션 (tech-decision §2 — postgres-js driver + Drizzle).
 *
 * 보안: 이 모듈은 server-side only.
 * 클라이언트 번들에 포함되면 안 됨 (DATABASE_URL 노출 위험).
 *
 * "server-only" 마커로 빌드 타임 보호.
 */

import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL 환경 변수가 설정되어 있지 않습니다. .env.local 또는 .env.local.example 참조.",
  );
}

// Edge runtime 호환을 위해 prepare 비활성 + max 1 (Next.js Route Handler hot reload 대비).
const queryClient = postgres(databaseUrl, {
  max: 1,
  prepare: false,
});

export const db = drizzle(queryClient, { schema });
export { schema };
