"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
};

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20h14v-9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.6-3.6" />
    </svg>
  );
}

function TrashIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

const TABS: Tab[] = [
  {
    href: "/",
    label: "홈",
    icon: null,
    match: (p) => p === "/" || p.startsWith("/dish/") || p.startsWith("/video/"),
  },
  {
    href: "/search",
    label: "검색",
    icon: null,
    match: (p) => p.startsWith("/search"),
  },
  {
    href: "/trash",
    label: "휴지통",
    icon: null,
    match: (p) => p.startsWith("/trash"),
  },
];

const ICONS: Record<string, (props: { active: boolean }) => React.ReactNode> = {
  "/": (p) => <HomeIcon {...p} />,
  "/search": (p) => <SearchIcon {...p} />,
  "/trash": (p) => <TrashIcon {...p} />,
};

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  return (
    <nav aria-label="주요 메뉴" className="sticky bottom-0 z-30 mt-auto">
      <div className="rule-dotted" />
      <div
        className="bg-ivory/92 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <ul className="mx-auto flex max-w-content items-stretch justify-around px-2">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = ICONS[tab.href];
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "group relative flex h-16 flex-col items-center justify-center gap-1 transition",
                    active
                      ? "text-pink-deep"
                      : "text-ink-faint hover:text-ink-muted",
                  )}
                >
                  <span
                    className={clsx(
                      "transition",
                      active ? "-translate-y-px" : "translate-y-[1px]",
                    )}
                  >
                    {Icon ? <Icon active={active} /> : null}
                  </span>
                  <span
                    className={clsx(
                      "text-[12px] leading-none transition-all duration-200",
                      active
                        ? "font-semibold"
                        : "font-normal",
                    )}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
