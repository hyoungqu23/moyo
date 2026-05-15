/**
 * requireAuth() — tech-decision §4.3.
 *
 * 모든 API Route + 인증 필요 Server Component에서 호출.
 * 세션 없으면 throw → 호출자가 401 응답으로 변환.
 *
 * 보안 경계 (L27):
 *   - Drizzle direct connection 경로에서 RLS 미작동.
 *   - 모든 후속 쿼리에 eq(table.userId, userId) 강제.
 */

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export class UnauthenticatedError extends Error {
  constructor() {
    super("Unauthenticated");
    this.name = "UnauthenticatedError";
  }
}

export interface AuthenticatedUser {
  userId: string;
  email: string | null;
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthenticatedError();
  }

  return {
    userId: user.id,
    email: user.email ?? null,
  };
}

/**
 * Route Handler에서 쓰는 헬퍼.
 * Unauthenticated면 401 응답.
 */
export async function withAuth<T>(
  handler: (user: AuthenticatedUser) => Promise<T>,
): Promise<T | Response> {
  try {
    const user = await requireAuth();
    return await handler(user);
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return Response.json({ error: "Unauthenticated" }, { status: 401 });
    }
    throw error;
  }
}
