"use client";

import { PropsWithChildren, KeyboardEvent } from "react";

interface CheckboxContainerProps extends PropsWithChildren {
  checked?: boolean;
  onClick?: () => void;
}

export function CheckboxContainer({
  children,
  checked,
  onClick,
}: CheckboxContainerProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={checked || false}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all hover:bg-muted ${
        checked ? "border-primary bg-primary/5" : "border-input"
      }`}
    >
      {children}
    </div>
  );
}