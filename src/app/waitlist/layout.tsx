"use client";

import React, { useEffect, useState } from "react";

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className={
        isDark
          ? "min-h-screen w-full bg-black relative overflow-hidden"
          : "min-h-screen w-full bg-white relative overflow-hidden"
      }
    >
      <div
        className="absolute inset-0 z-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.25), transparent 70%), #000000"
            : "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.07), transparent 70%), #ffffff",
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}