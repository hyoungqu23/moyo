"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError, apiJson } from "@/lib/api";

interface TrashResponse {
  trashedAttempts: Array<{
    id: string;
    recipeId: string;
    recipeTitle: string | null;
    rating: string | null;
    triedAt: string;
    deletedAt: string;
  }>;
}

export default function TrashPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["trash"],
    queryFn: () => apiJson.get<TrashResponse>("/api/attempts/trash"),
  });

  const restoreMutation = useMutation<unknown, ApiError, string>({
    mutationFn: (id) => apiJson.post(`/api/attempts/${id}/restore`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash"] });
      toast.show("복구했어요.", "success");
    },
    onError: (e) => toast.show(e.message, "error"),
  });
  const permanentMutation = useMutation<void, ApiError, string>({
    mutationFn: (id) => apiJson.delete(`/api/attempts/${id}/permanent`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trash"] });
      toast.show("영구 삭제했어요.", "success");
    },
    onError: (e) => toast.show(e.message, "error"),
  });

  return (
    <main className="mx-auto w-full max-w-content px-4 py-12">
      <Link href="/" className="text-caption text-primary hover:underline">
        ← 홈
      </Link>
      <h1 className="mt-4 text-tagline text-ink">휴지통</h1>
      <p className="mt-2 text-caption text-ink-muted-48">
        삭제한 시도 기록은 30일 후 자동으로 영구 삭제돼요.
      </p>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : !data || data.trashedAttempts.length === 0 ? (
        <EmptyState className="mt-12" title="삭제한 기록이 없어요" />
      ) : (
        <ul className="mt-8 divide-y divide-divider-soft">
          {data.trashedAttempts.map((a) => (
            <li key={a.id} className="py-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-body text-ink truncate">
                  {a.recipeTitle ?? "(삭제된 레시피)"}
                </p>
                <p className="mt-1 text-caption text-ink-muted-80">
                  {a.triedAt} {a.rating && `· ★ ${a.rating}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary-pill"
                  onClick={() => restoreMutation.mutate(a.id)}
                  disabled={restoreMutation.isPending}
                >
                  복구
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm("정말 영구 삭제할까요? 되돌릴 수 없어요.")) {
                      permanentMutation.mutate(a.id);
                    }
                  }}
                  disabled={permanentMutation.isPending}
                >
                  영구 삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
