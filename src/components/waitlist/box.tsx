import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { Button } from "../ui/button";
import Link from "next/link";

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
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="inline h-5 w-5 text-neutral-600 dark:text-neutral-400"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.476 2 2 6.571 2 12.149c0 4.46 2.865 8.238 6.839 9.572.5.093.682-.221.682-.487 
                0-.24-.009-.868-.014-1.703-2.782.615-3.369-1.366-3.369-1.366-.454-1.175-1.11-1.488-1.11-1.488-.908-.633.069-.62.069-.62 
                1.004.072 1.533 1.048 1.533 1.048.893 1.556 2.341 1.107 2.91.846.092-.654.35-1.108.636-1.362-2.221-.257-4.555-1.135-4.555-5.05 
                0-1.116.385-2.029 1.017-2.745-.102-.257-.441-1.292.097-2.693 0 0 .834-.27 2.733 1.048A9.31 9.31 0 0 1 12 6.844c.846.004 1.698.116 
                2.493.341 1.898-1.317 2.73-1.049 2.73-1.049.54 1.401.201 2.436.099 2.693.633.716 1.016 1.629 1.016 2.745 0 3.924-2.337 
                4.79-4.566 5.042.359.314.678.936.678 1.887 0 1.362-.012 2.46-.012 2.795 0 .269.18.584.688.485C19.138 20.385 22 16.608 
                22 12.149 22 6.571 17.523 2 12 2z"
              />
            </svg>
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