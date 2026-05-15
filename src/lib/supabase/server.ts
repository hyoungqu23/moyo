/**
 * Supabase server-side client — Auth 전용.
 *
 * tech-decision §4: supabase-js는 Auth에만 사용, DB 쿼리는 Drizzle 단일 경로.
 * 보안: SERVICE_ROLE_KEY는 server-only 환경 변수.
 */

import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경 변수 누락. .env.local 참조.",
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>,
      ) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component 호출 컨텍스트에서는 set 호출이 throw. middleware 또는 Route Handler에서만 동작.
        }
      },
    },
  });
}
