/**
 * 홈 (/) — v0.5 F-6에서 본격 구현.
 * 현재는 셋업 단계 placeholder. requireAuth 흐름은 layout 단계에서 처리 예정.
 */

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-content flex-col px-4 py-12">
      <h1 className="text-display-lg text-ink">나만의요리사</h1>
      <p className="mt-4 text-body text-ink-muted-80">
        다양한 출처의 레시피를 내 레시피로 정규화·축적하는 개인 레시피북.
      </p>
      <p className="mt-12 text-caption text-ink-muted-48">
        v0.5 셋업 진행 중. 곧 첫 레시피를 가져올 수 있어요.
      </p>
    </main>
  );
}
