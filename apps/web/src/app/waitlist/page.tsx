"use client";

import { InputForm } from "@/components/waitlist/form";
import { WaitlistWrapper } from "@/components/waitlist/box";
import React, { useState } from "react";
import { submitWaitlistAction } from "@/actions/waitlist";
import { Alex_Brush } from "next/font/google";
import clsx from "clsx";
import { ScrollArea } from "@pilot/ui/components/scroll-area";

const font = Alex_Brush({
  variable: "--font-alex-brush",
  subsets: ["latin"],
  weight: "400",
});

export default function WaitlistPage() {
  const [activeTab, setActiveTab] = useState<"waitlist" | "manifesto">(
    "waitlist",
  );
  const buttonCopy = {
    idle: "Join waitlist",
    success: "You're in!",
    loading: "Joining...",
  };

  const formAction = submitWaitlistAction;

  return (
    <div className="max-w-screen-sm mx-auto w-full flex flex-col min-h-screen">
      <div className="px-5 gap-8 flex flex-col flex-1 py-[5vh] md:py-[8vh]">
        <div className="flex flex-col items-center justify-center">
          <nav className="bg-background rounded-full">
            <div
              className={clsx(
                "bg-background rounded-full p-1 flex relative items-center",
                "shadow-[0px_-1px_3px_0px_rgba(0,_0,_0,_0.05),_0px_7px_2px_0px_rgba(0,_0,_0,_0.02),_0px_4px_2px_0px_rgba(0,_0,_0,_0.05),_0px_2px_1px_0px_rgba(0,_0,_0,_0.05),_0px_1px_1px_0px_rgba(0,_0,_0,_0.03),_0px_0px_1px_0px_rgba(0,_0,_0,_0.04)]",
                "dark:shadow-[0px_-1px_3px_0px_rgba(0,_0,_0,_0.03),_0px_7px_2px_0px_rgba(0,_0,_0,_0.03),_0px_4px_2px_0px_rgba(0,_0,_0,_0.05),_0px_2px_1px_0px_rgba(0,_0,_0,_0.1),_0px_1px_1px_0px_rgba(0,_0,_0,_0.1),_0px_0px_1px_0px_rgba(0,_0,_0,_0.1)]",
              )}
            >
              <div
                className={clsx(
                  "absolute transition-all duration-200 ease-in-out h-7 rounded-full bg-secondary/80 dark:bg-accent/80",
                )}
                style={{
                  width: `90px`,
                  left: activeTab === "waitlist" ? "4px" : "calc(90px + 4px)",
                }}
              />
              <button
                onClick={() => setActiveTab("waitlist")}
                className={`relative text-sm font-medium py-1 px-4 transition-colors duration-200 text-foreground w-[90px] flex items-center justify-center
                  ${
                    activeTab === "waitlist"
                      ? "opacity-100"
                      : "opacity-30 hover:opacity-60"
                  }`}
              >
                Waitlist
              </button>
              <button
                onClick={() => setActiveTab("manifesto")}
                className={`relative text-sm font-medium py-1 px-4 transition-colors duration-200 text-foreground w-[90px] flex items-center justify-center
                  ${
                    activeTab === "manifesto"
                      ? "opacity-100"
                      : "opacity-30 hover:opacity-60"
                  }`}
              >
                Manifesto
              </button>
            </div>
          </nav>
        </div>
        <main className="flex justify-center">
          {activeTab === "waitlist" ? (
            <WaitlistWrapper className="max-w-[540px]">
              <div className="px-1 flex flex-col w-full self-stretch items-center text-center gap-4">
                <div className="flex justify-center w-full items-center mx-auto">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Pilot
                  </h1>
                </div>
                <div className="flex flex-col gap-2 mb-2">
                  <h2 className="text-3xl font-semibold text-foreground">
                    join the waitlist
                  </h2>
                  <p className="text-pretty text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
                    be among the first to try pilot — open source tools built
                    for real workflows, shaped with early feedback.
                  </p>
                </div>
                <InputForm buttonCopy={buttonCopy} formAction={formAction} />
              </div>
            </WaitlistWrapper>
          ) : (
            <WaitlistWrapper className="max-w-[640px]">
              <div className="flex flex-col gap-6 w-full">
                <h2
                  className={clsx(
                    "text-foreground text-4xl sm:text-5xl md:text-6xl text-pretty",
                    font.className,
                  )}
                >
                  the pilot manifesto
                </h2>
                <ScrollArea className="w-full max-h-[45vh] pr-1">
                  <div className="text-muted-foreground text-xs sm:text-sm md:text-base [&>p]:tracking-tight [&>p]:leading-[1.6] [&>p:not(:last-child)]:mb-3 text-pretty text-start">
                    <p>
                      pilot helps you turn instagram conversations into real
                      pipeline. creators, founders, and small teams should not
                      need to juggle dms, sheets, and random tools.
                    </p>
                    <p>
                      we built pilot as a sales system. it handles
                      conversations, keeps crm context, and makes handoff clear
                      when a human should reply.
                    </p>
                    <p>
                      safety is part of the product. we focus on account health,
                      risk-aware throttling, and hrn guardrails for sensitive
                      threads.
                    </p>
                    <p>
                      pilot is open source because trust matters. you can read
                      the code, self-host it, and keep control of your data.
                    </p>
                    <p>
                      we ship in small steps. reliability comes first. we test,
                      learn, and improve with real feedback.
                    </p>
                    <p>
                      current priorities are practical. knowledge-base ingest,
                      better comment-to-dm flows, natural-language trigger
                      matching, and safer sending behavior.
                    </p>
                    <p>
                      next we are going deeper on crm and analytics. better
                      pipeline visibility, lead scoring, attribution, and
                      automation diagnostics.
                    </p>
                    <p>
                      if this matches how you work, join the waitlist. we want
                      to build this with you.
                    </p>
                    <p>— the pilot team</p>
                  </div>
                </ScrollArea>
              </div>
            </WaitlistWrapper>
          )}
        </main>
      </div>
    </div>
  );
}
