"use client";

import { PropsWithChildren } from "react";

interface CheckboxContainerProps extends PropsWithChildren {
  checked?: boolean;
  onClick?: () => void;
}

export function CheckboxContainer({
  children,
  checked,
  onClick,
}: CheckboxContainerProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all hover:bg-muted ${
        checked ? "border-primary bg-primary/5" : "border-input"
      }`}
    >
      {children}
    </div>
  );
}