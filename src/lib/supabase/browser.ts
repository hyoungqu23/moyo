/**
 * Supabase browser client — OAuth 시작 + 클라이언트 세션 읽기.
 *
 * 사용 위치: signin page, sign-out 트리거.
 * DB 쿼리는 절대 여기에서 호출하지 않는다 (Drizzle 단일 경로).
 */

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 공개 환경 변수가 설정되어 있지 않습니다.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
