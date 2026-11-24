import type { ReactNode } from "react";

export function Device({ children }: { children: ReactNode }) {
  return (
    <div className="stage">
      <div className="device">{children}</div>
    </div>
  );
}
