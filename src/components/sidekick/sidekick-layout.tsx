"use client";

import { useSidekick } from "./sidekick-context";
import { ReactNode } from "react";

interface SidekickLayoutProps {
  children: ReactNode;
}

export function SidekickLayout({ children }: SidekickLayoutProps) {
  const { isSidebarOpen } = useSidekick();

  return (
    <section className={`flex gap-6 ${isSidebarOpen ? "flex-col" : "flex-row"}`}>
      {children}
    </section>
  );
}