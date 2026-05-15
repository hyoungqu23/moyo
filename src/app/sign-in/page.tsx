"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInShell />}>
      <SignInForm />
    </Suspense>
  );
}

function SignInShell() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-content flex-col items-center justify-center px-4">
      <h1 className="text-display-lg text-ink text-center">나만의요리사</h1>
    </main>
  );
}

function SignInForm() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const nextPath = searchParams.get("next") ?? "/";
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam) {
      toast.show(errorParam, "error");
    }
  }, [errorParam, toast]);

  const onGoogleSignIn = async () => {
    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectUrl = new URL("/auth/callback", window.location.origin);
      if (nextPath !== "/") {
        redirectUrl.searchParams.set("next", nextPath);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl.toString(),
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.show(
        err instanceof Error ? err.message : "로그인을 시작할 수 없어요.",
        "error",
      );
      setPending(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-content flex-col items-center justify-center px-4">
      <h1 className="text-display-lg text-ink text-center">나만의요리사</h1>
      <p className="mt-3 text-body text-ink-muted-80 text-center max-w-prosewide">
        다양한 출처의 레시피를 내 레시피로 정리해서, 매번 더 나은 결과를 만드는 개인 레시피북.
      </p>
      <Button
        variant="primary"
        className="mt-10 min-w-[220px]"
        onClick={onGoogleSignIn}
        disabled={pending}
      >
        {pending ? "이동 중…" : "Google로 시작하기"}
      </Button>
    </main>
  );
}
