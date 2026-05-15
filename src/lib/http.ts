/**
 * API Route 공통 응답 헬퍼.
 *
 * 표준화된 에러 코드 + status 매핑.
 */

import { ZodError } from "zod";

import { UnauthenticatedError } from "@/lib/auth";
import { ForbiddenError, NotFoundError } from "@/lib/recipes/ownership";

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "HAS_ATTEMPTS"
  | "HAS_RECIPES"
  | "NOT_ARCHIVED"
  | "RATE_LIMIT"
  | "EXTERNAL_API_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: string;
  code: ErrorCode;
  details?: unknown;
}

export function jsonError(
  message: string,
  code: ErrorCode,
  status: number,
  details?: unknown,
): Response {
  const body: ApiErrorBody = { error: message, code };
  if (details !== undefined) body.details = details;
  return Response.json(body, { status });
}

/**
 * 공통 예외 → Response 매핑. Route Handler try/catch 끝에 호출.
 */
export function errorToResponse(error: unknown): Response {
  if (error instanceof UnauthenticatedError) {
    return jsonError("로그인이 필요합니다.", "UNAUTHENTICATED", 401);
  }
  if (error instanceof NotFoundError) {
    return jsonError(error.message, "NOT_FOUND", 404);
  }
  if (error instanceof ForbiddenError) {
    return jsonError(error.message, "FORBIDDEN", 403);
  }
  if (error instanceof ZodError) {
    return jsonError("입력 값이 올바르지 않습니다.", "VALIDATION_ERROR", 400, error.flatten());
  }
  if (error instanceof Error) {
    console.error("[api] unhandled error:", error);
    return jsonError(error.message || "Internal Server Error", "INTERNAL_ERROR", 500);
  }
  console.error("[api] unknown error:", error);
  return jsonError("Internal Server Error", "INTERNAL_ERROR", 500);
}
