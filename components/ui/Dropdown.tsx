import type { ReactNode } from "react";

export function Dropdown({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-white p-2">
      {children}
    </div>
  );
}
