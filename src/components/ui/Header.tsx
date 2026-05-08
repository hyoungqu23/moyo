"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export function Header({ email }: { email: string | null }) {
  const initial = (email?.[0] ?? "?").toUpperCase();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-5">
        <Link
          href="/"
          aria-label="나만의 요리사 홈"
          className="group inline-flex items-center gap-1.5"
        >
          <span
            aria-hidden
            className="text-[14px] text-pink-deep transition group-hover:rotate-12"
          >
            ✿
          </span>
          <span className="font-display text-[18px] font-medium leading-none text-ink">
            나만의 요리사
          </span>
        </Link>

        <div className="relative" ref={ref}>
          <button
            type="button"
            aria-label="계정 메뉴"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-full border border-pink-deep/40 bg-pink-soft text-[12px] font-semibold text-pink-ink transition active:scale-95 hover:bg-pink/70"
          >
            {initial}
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 top-10 w-60 origin-top-right overflow-hidden rounded-md border border-hairline bg-ivory-soft shadow-sticker"
            >
              {email ? (
                <div className="border-b border-hairline px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-pink-deep">
                    Signed in
                  </p>
                  <p className="mt-1 truncate text-[14px] text-ink">{email}</p>
                </div>
              ) : null}
              <form action="/api/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center justify-between px-4 py-3 text-[14px] text-ink transition hover:bg-pink-soft"
                >
                  <span>로그아웃</span>
                  <span aria-hidden className="text-[12px] text-ink-muted">
                    →
                  </span>
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
      <div className="rule-hairline" />
    </header>
  );
}
