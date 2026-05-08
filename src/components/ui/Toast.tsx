export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm text-white"
    >
      {message}
    </div>
  );
}
