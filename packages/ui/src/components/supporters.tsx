"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./tooltip";
import { cn } from "../lib/utils";

type SupportersProps = React.ComponentProps<"section">;

const companies = [
  {
    name: "Greptile",
    src: "/greptile.svg",
    className: "h-10",
    tooltip:
      "Free Greptile license through their open source program, with setup support.",
  },
  {
    name: "Supermemory",
    src: "/supermemory.svg",
    className: "h-8",
    tooltip:
      "Startup Program support: $1,000 in Pro credits for 6 months, product team access, early feature access, and collaboration opportunities.",
  },
] as const;

export default function Supporters({
  className,
  ...props
}: SupportersProps) {
  return (
    <section className={cn("bg-background py-12 sm:py-16", className)} {...props}>
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-foreground text-lg font-medium">
            Supported by teams building alongside us.
          </p>
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            We are grateful for the partners helping us build and improve Pilot.
          </p>
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:mt-12 sm:gap-x-14">
          {companies.map((company) => (
            <Tooltip key={company.name}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`${company.name} support details`}
                  className="cursor-default rounded-md p-1"
                >
                  <img
                    src={company.src}
                    alt={company.name}
                    className={cn(
                      "h-8 w-auto object-contain brightness-0 dark:invert",
                      company.className
                    )}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="max-w-xs p-3">
                {company.tooltip}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </section>
  );
}
