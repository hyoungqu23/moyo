import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "moyo",
  description: "유튜브 레시피 시도 기록 도구"
};

function GlobalNav() {
  return (
    <nav className="sticky top-0 z-40 h-11 bg-black text-white">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-6 text-xs">
        <Link href="/" className="font-semibold">
          moyo
        </Link>
        <div className="flex gap-5">
          <Link href="/">홈</Link>
          <Link href="/search">검색</Link>
          <Link href="/trash">휴지통</Link>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <GlobalNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
