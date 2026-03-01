"use client";

import { useSidekick } from "./context";
import { ReactNode } from "react";

interface SidekickLayoutProps {
  children: ReactNode;
}

export function SidekickLayout({ children }: SidekickLayoutProps) {
  const { open } = useSidekick();

  return (
    <section className={`flex gap-6 ${open ? "flex-col" : "flex-row"}`}>
      {children}
    </section>
  );
}