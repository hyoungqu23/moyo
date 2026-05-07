"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { apiFetch } from "@/lib/api";
import type { Attempt } from "@/db/schema";

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
    <main className="bg-white px-8 py-20">
      <section
        className="mx-auto max-w-content"
        aria-labelledby="trash-heading"
      >
        <h1
          id="trash-heading"
          className="mb-8 text-[40px] font-semibold leading-[1.1]"
        >
          휴지통
        </h1>
        {trash.isLoading ? (
          <div className="grid gap-4">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : trash.isError ? (
          <EmptyState title="휴지통을 불러오지 못했어요" />
        ) : !trash.data?.attempts.length ? (
          <EmptyState title="삭제된 기록이 없어요" />
        ) : (
          <div className="grid gap-4">
            {trash.data.attempts.map((attempt) => (
              <Card
                key={attempt.id}
                className="flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <h2 className="text-[17px] font-semibold">
                    시도 {attempt.id.slice(0, 8)}
                  </h2>
                  <p className="text-sm text-ink-muted">
                    시도일 {attempt.triedAt} · 삭제일{" "}
                    {attempt.deletedAt
                      ? new Date(attempt.deletedAt).toISOString().slice(0, 10)
                      : "-"}
                  </p>
                </div>
                <div className="flex gap-2">
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
              </Card>
            ))}
          </div>
        )}
      </section>
      {toast ? <Toast message={toast} /> : null}
    </main>
  );
}
