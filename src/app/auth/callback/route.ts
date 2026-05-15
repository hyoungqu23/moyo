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
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
