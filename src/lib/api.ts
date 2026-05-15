/**
 * 클라이언트 API fetch wrapper.
 *
 * - Drizzle 직접 호출 금지 — 모든 DB 접근은 Route Handler 경유.
 * - 응답 에러는 ApiError로 throw → react-query mutation 측 catch.
 */

import type { ApiErrorBody } from "@/lib/http";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorBody["code"] | "UNKNOWN",
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
    credentials: "same-origin",
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const errBody: Partial<ApiErrorBody> = (body as Partial<ApiErrorBody> | undefined) ?? {};
    throw new ApiError(
      res.status,
      errBody.code ?? "UNKNOWN",
      errBody.error ?? res.statusText,
      errBody.details,
    );
  }
  return body as T;
}

export const apiJson = {
  get: <T>(url: string) => apiFetch<T>(url, { method: "GET" }),
  post: <T>(url: string, data: unknown) =>
    apiFetch<T>(url, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(url: string, data: unknown) =>
    apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T = void>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
};
