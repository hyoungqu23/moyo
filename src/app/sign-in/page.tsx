"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className="shrink-0">
      <path
        fill="#EA4335"
        d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"
      />
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#FBBC05"
        d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"
      />
    </svg>
  );
}

function FloralRow() {
  return (
    <div aria-hidden className="flex items-center justify-center gap-3 text-pink-deep">
      <span className="h-px w-8 bg-pink-deep/40" />
      <span className="text-[14px]">✿</span>
      <span className="text-[10px] text-mint-deep">❀</span>
      <span className="text-[14px]">✿</span>
      <span className="h-px w-8 bg-pink-deep/40" />
    </div>
  );
}

function SignInInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const errorMsg = params.get("error");
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    setPending(true);
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setPending(false);
      window.location.href = `/sign-in?error=${encodeURIComponent(error.message)}`;
    }
  }

  return (
    <main className="relative flex min-h-[100svh] items-center justify-center px-6">
      <div className="w-full max-w-[380px]">
        {/* Brand mark stack */}
        <div className="mb-10 flex flex-col items-center text-center">
          <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-pink-deep">
            Personal recipe diary
          </p>
          <h1 className="font-display mt-3 text-[44px] font-medium leading-[1.05] text-ink">
            나만의 요리사
          </h1>
          <div className="mt-5 w-full">
            <FloralRow />
          </div>
          <p className="mt-6 max-w-[280px] text-[14px] leading-relaxed text-ink-soft">
            영상으로 따라한 요리, 별점과 메모로 남기는
            <br />
            나만의 작은 부엌 노트.
          </p>
        </div>

        {/* Tag chips — show palette character */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-1.5">
          <span className="rounded-full bg-pink-soft px-3 py-1 text-[12px] text-pink-ink">
            ♥ 별점
          </span>
          <span className="rounded-full bg-mint-soft px-3 py-1 text-[12px] text-mint-ink">
            ✓ 시도 기록
          </span>
          <span className="rounded-full bg-lavender-soft px-3 py-1 text-[12px] text-lavender-ink">
            ✎ 메모
          </span>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={pending}
          className="group relative flex w-full items-center justify-center gap-3 rounded-full bg-pink-deep py-3.5 text-[15px] font-medium text-white shadow-sticker transition hover:bg-pink-ink active:scale-[0.98] disabled:opacity-60"
        >
          <GoogleGlyph />
          <span>{pending ? "이동 중…" : "Google로 시작하기"}</span>
          <span
            aria-hidden
            className="text-[12px] text-white/70 transition group-hover:translate-x-0.5"
          >
            →
          </span>
        </button>

        {errorMsg ? (
          <p
            role="alert"
            className="mt-4 rounded-sm border-l-2 border-danger bg-danger/5 px-3 py-2 text-[12px] text-danger"
          >
            {decodeURIComponent(errorMsg)}
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
