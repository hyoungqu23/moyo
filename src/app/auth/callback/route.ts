/**
 * GET /auth/callback?code={code}
 *
 * Supabase OAuth 리디렉션 핸들러.
 * code → session 교환 후 home으로 이동.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // /sign-in?next=/recipe/123 → 콜백에서 next 유지하여 원래 경로 복귀.
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // 교환 실패 시 /sign-in으로 되돌리고 사용자에게 알림.
      const url = new URL("/sign-in", requestUrl.origin);
      url.searchParams.set("error", error.message);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
