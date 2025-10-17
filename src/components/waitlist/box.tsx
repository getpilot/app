import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import { Icons } from "../icons";

export function WaitlistWrapper({
  children,
  className,
}: PropsWithChildren & { className?: string }) {
  return (
    <div
      className={clsx(
        "w-full mx-auto max-w-[500px] flex flex-col justify-center items-center",
        "bg-white/70 dark:bg-neutral-900/70 pb-0 overflow-hidden rounded-2xl",
        "shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.08),0px_2px_4px_-1px_rgba(0,0,0,0.03)]",
        "border border-neutral-200/50 dark:border-neutral-800/80",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4 flex-1 text-center w-full p-8 pb-4">
        <div className="flex flex-col gap-10">{children}</div>
      </div>
      <footer className="border-t border-neutral-200/50 dark:border-neutral-800/80 flex justify-between items-center w-full self-stretch px-8 py-3 text-sm bg-neutral-50/70 dark:bg-neutral-800/20 overflow-hidden gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="https://github.com/pilot-ops-crm/app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub repository"
            className="hover:opacity-75 transition-opacity"
          >
            <Icons.Github width="18" height="18" />
          </Link>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            open source. built with care. © {new Date().getFullYear()} Pilot.
          </p>
        </div>
        <Link href="/sidekick">
          <Button variant="link" size="sm" className="text-xs">
            go to app
          </Button>
        </Link>
      </footer>
    </div>
  );
}
