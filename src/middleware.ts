/**
 * Next.js middleware — 모든 페이지 진입 시 Supabase 세션 확인.
 *
 * 미로그인 사용자가 임의 페이지(/recipe/X, /search 등)로 직접 진입 시
 * /sign-in으로 redirect. (홈만 server-side requireAuth로 처리하던 H1 가드 누락 보강)
 *
 * 통과 대상:
 *   - /sign-in, /auth/* (로그인 흐름 자체)
 *   - /api/* (각 Route Handler가 requireAuth로 자체 401 처리)
 *   - _next 정적 자원 (matcher에서 제외)
 */

import { NextResponse, type NextRequest } from "next/server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PUBLIC_PREFIXES = ["/sign-in", "/auth/"] as const;

function isPublic(pathname: string): boolean {
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/api/")) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 공개 경로 + API는 통과. API는 자체 requireAuth가 401 응답을 줌.
  if (isPublic(pathname)) {
    return NextResponse.next({ request });
  }

  const response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경 변수 미설정 시 redirect 시도 자체 불가 → sign-in으로 보내고 거기서 안내.
  if (!supabaseUrl || !supabaseAnonKey) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookies: Array<{ name: string; value: string; options: CookieOptions }>,
      ) {
        for (const { name, value, options } of cookies) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    // 로그인 후 원래 경로로 돌려보낼 수 있게 next 파라미터로 인계.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
