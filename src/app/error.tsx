"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app:error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-content flex-col items-center justify-center px-4 text-center">
      <h1 className="text-display-lg text-ink">문제가 생겼어요</h1>
      <p className="mt-3 text-body text-ink-muted-80">
        잠시 후 다시 시도해주세요. 같은 오류가 반복되면 새로고침해주세요.
      </p>
      {error.digest && (
        <p className="mt-2 text-caption text-ink-muted-48">에러 ID: {error.digest}</p>
      )}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </main>
  );
}
