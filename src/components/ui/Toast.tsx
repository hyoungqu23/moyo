export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-[13px] text-ivory-soft shadow-sticker"
    >
      <span aria-hidden className="text-pink">
        ✿
      </span>
      <span>{message}</span>
    </div>
  );
}
