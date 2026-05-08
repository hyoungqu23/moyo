"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import type { Attempt } from "@/db/schema";

function formatYmd(input: string | Date | null | undefined): string | null {
  if (!input) return null;
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return null;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}월 ${day}일`;
}

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const trash = useQuery({
    queryKey: ["attempts", "trash"],
    queryFn: () => apiFetch<{ attempts: Attempt[] }>("/api/attempts/trash"),
  });

  const restore = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/attempts/${id}/restore`, { method: "POST" }),
    onSuccess: () => {
      setToast("복구했어요");
      queryClient.invalidateQueries({ queryKey: ["attempts", "trash"] });
      queryClient.invalidateQueries({ queryKey: ["home"] });
    },
    onError: (error: Error) => setToast(error.message ?? "복구에 실패했어요"),
  });

  const permanent = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/attempts/${id}/permanent`, { method: "DELETE" }),
    onSuccess: () => {
      setToast("영구 삭제했어요");
      queryClient.invalidateQueries({ queryKey: ["attempts", "trash"] });
    },
    onError: (error: Error) =>
      setToast(error.message ?? "영구 삭제에 실패했어요"),
  });

  return (
    <div className="px-5 pt-5">
      <header className="mb-6">
        <p className="flex items-center gap-2 text-[12px] text-lavender-deep">
          <span aria-hidden>✿</span>
          <span>지운 기록</span>
        </p>
        <h1 className="font-display mt-1 text-[26px] font-medium leading-tight text-ink">
          휴지통
        </h1>
        <p className="mt-1 text-[13px] text-ink-muted">
          복구하거나 영구 삭제할 수 있어요.
        </p>
      </header>

      {trash.isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : trash.isError ? (
        <EmptyState title="휴지통을 불러오지 못했어요" />
      ) : !trash.data?.attempts.length ? (
        <EmptyState
          title="휴지통이 비어 있어요"
          description="삭제한 시도 기록이 여기에 모여요."
        />
      ) : (
        <ul className="stagger space-y-3">
          {trash.data.attempts.map((attempt) => {
            const tried = formatYmd(attempt.triedAt);
            const deleted = formatYmd(attempt.deletedAt);
            return (
              <li
                key={attempt.id}
                className="rounded-md border border-hairline bg-ivory-soft p-4 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[14px] font-medium text-ink">
                      시도 #{attempt.id.slice(0, 6)}
                    </h2>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-ink-muted">
                      <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-mint-ink">
                        <span aria-hidden>✓</span>
                        <span className="font-tnum">시도 {tried ?? "—"}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-lavender-soft px-2 py-0.5 text-lavender-ink">
                        <span aria-hidden>🗑</span>
                        <span className="font-tnum">
                          삭제 {deleted ?? "—"}
                        </span>
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="secondary-pill"
                      disabled={restore.isPending}
                      onClick={() => restore.mutate(attempt.id)}
                    >
                      복구
                    </Button>
                    <Button
                      variant="danger"
                      disabled={permanent.isPending}
                      onClick={() => permanent.mutate(attempt.id)}
                    >
                      영구 삭제
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {toast ? <Toast message={toast} /> : null}
    </div>
  );
}
