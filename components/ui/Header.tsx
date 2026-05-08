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
    <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-5">
        <Link
          href="/"
          aria-label="나만의 요리사 홈"
          className="group inline-flex items-baseline gap-1.5"
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 -translate-y-[1px] rounded-full bg-persimmon transition group-hover:scale-125"
          />
          <span className="text-[22px] leading-none text-ink">
            나만의 요리사
          </span>
        </Link>

        <div className="relative" ref={ref}>
          <button
            type="button"
            aria-label="계정 메뉴"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-8 w-8 place-items-center rounded-full bg-ink text-[12px] font-medium text-paper-2 transition active:scale-95"
          >
            {initial}
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 top-10 w-56 origin-top-right overflow-hidden rounded-md border border-hairline bg-paper-2 shadow-ink"
            >
              {email ? (
                <div className="border-b border-hairline px-4 py-3">
                  <p className="text-[13px] text-ink-muted">로그인</p>
                  <p className="mt-1 truncate text-[15px] text-ink">{email}</p>
                </div>
              ) : null}
              <form action="/api/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="flex w-full items-center justify-between px-4 py-3 text-[15px] text-ink transition hover:bg-paper-3"
                >
                  로그아웃
                  <span className="text-[15px] text-ink-muted">→</span>
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
