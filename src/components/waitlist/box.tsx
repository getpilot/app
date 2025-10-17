import clsx from "clsx";
import type { PropsWithChildren } from "react";

export function WaitlistWrapper({
  children,
  className,
}: PropsWithChildren & { className?: string }) {
  return (
    <div
      className={clsx(
        "w-full mx-auto max-w-[500px] flex flex-col justify-center items-center",
        "bg-white/95 dark:bg-neutral-900/90 pb-0 overflow-hidden rounded-2xl",
        "shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.08),0px_2px_4px_-1px_rgba(0,0,0,0.03)]",
        "border border-neutral-200/50 dark:border-neutral-800/80",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 flex-1 text-center w-full p-8 pb-4">
        <div className="flex flex-col gap-10">{children}</div>
      </div>
      <footer className="border-t border-neutral-200/50 dark:border-neutral-800/80 flex justify-between items-center w-full self-stretch px-8 py-3 text-sm bg-neutral-50/50 dark:bg-neutral-900/80 overflow-hidden">
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          © {new Date().getFullYear()} pilot. All rights reserved.
        </p>
      </footer>
    </div>
  );
}