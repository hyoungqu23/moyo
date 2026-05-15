import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-content flex-col items-center justify-center px-4 text-center">
      <h1 className="text-display-lg text-ink">페이지를 찾을 수 없어요</h1>
      <p className="mt-3 text-body text-ink-muted-80">
        주소가 잘못됐거나 삭제된 콘텐츠일 수 있어요.
      </p>
      <Link href="/" className="mt-8">
        <Button>홈으로</Button>
      </Link>
    </main>
  );
}
