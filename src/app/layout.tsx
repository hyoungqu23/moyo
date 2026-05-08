import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import { gowunBatang, nanumBrush } from "@/app/fonts";
import { BottomNav } from "@/components/ui/BottomNav";
import { Header } from "@/components/ui/Header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "나만의 요리사",
  description: "유튜브 레시피로 만들어 본 요리를 기록하는 부엌 일지",
};

export const viewport = {
  themeColor: "#f4ede0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;

  return (
    <html
      lang="ko"
      className={`${nanumBrush.variable} ${gowunBatang.variable}`}
    >
      <body className="text-ink antialiased">
        <Providers>
          {email ? (
            <div className="mx-auto flex min-h-[100svh] max-w-content flex-col bg-paper-2/40 shadow-page">
              <Header email={email} />
              <main className="flex-1 pb-4">{children}</main>
              <BottomNav />
            </div>
          ) : (
            <div className="min-h-[100svh]">{children}</div>
          )}
        </Providers>
      </body>
    </html>
  );
}
