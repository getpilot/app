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
    "waitlist"
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
                "dark:shadow-[0px_-1px_3px_0px_rgba(0,_0,_0,_0.03),_0px_7px_2px_0px_rgba(0,_0,_0,_0.03),_0px_4px_2px_0px_rgba(0,_0,_0,_0.05),_0px_2px_1px_0px_rgba(0,_0,_0,_0.1),_0px_1px_1px_0px_rgba(0,_0,_0,_0.1),_0px_0px_1px_0px_rgba(0,_0,_0,_0.1)]"
              )}
            >
              <div
                className={clsx(
                  "absolute transition-all duration-200 ease-in-out h-7 rounded-full bg-secondary/80 dark:bg-accent/80"
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
                    font.className
                  )}
                >
                  the pilot manifesto
                </h2>
                <ScrollArea className="w-full max-h-[45vh] pr-1">
                  <div className="text-white/70 text-xs sm:text-sm md:text-base [&>p]:tracking-tight [&>p]:leading-[1.6] [&>p:not(:last-child)]:mb-3 text-pretty text-start">
                    <p>
                      pilot started because we were tired of how messy instagram
                      workflows get. creators, small businesses, and solo
                      founders spend hours replying to dms, chasing leads, and
                      trying to stay organized. most tools that claim to help
                      either overcomplicate things or hide everything behind
                      paywalls and "pro" plans.
                    </p>
                    <p>so we built pilot.</p>
                    <p>
                      it helps you turn instagram interactions into something
                      you can actually manage. someone replies "yes" to your
                      reel, and pilot takes care of the rest — saving contacts,
                      sending follow-ups, tracking deals. it&apos;s meant to
                      feel like a quiet helper that works the way you do.
                    </p>
                    <p>
                      but what really defines pilot is that it&apos;s open
                      source.
                    </p>
                    <p>
                      we learned everything from open source — reading code,
                      breaking things, fixing them, learning from strangers on
                      the internet. pilot is our way of giving that back. the
                      code is open, the progress is public, and anyone can see
                      how it&apos;s built.
                    </p>
                    <p>
                      there&apos;s no hidden roadmap or "trust us" marketing.
                      what we&apos;re building is what you see. we still tell
                      our story and share what we&apos;re proud of, but
                      it&apos;s always grounded in reality.
                    </p>
                    <p>
                      right now, it&apos;s just us — building, testing,
                      improving. no big team, no community yet. just people who
                      care about making something that actually works.
                    </p>
                    <p>
                      pilot is open source because that&apos;s the only way we
                      know how to build: in the open, honestly, without
                      pretending to be more than we are.
                    </p>
                    <p>that&apos;s the whole point.</p>
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

