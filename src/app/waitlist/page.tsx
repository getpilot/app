"use client";

import { InputForm } from "@/components/waitlist/form";
import { WaitlistWrapper } from "@/components/waitlist/box";
import React, { useState } from "react";
import { addToWaitlist } from "@/actions/waitlist";
import { Alex_Brush } from "next/font/google";
import clsx from "clsx";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const formAction = async (data: FormData) => {
    const email = String(data.get("email") || "").trim();
    const name = String(data.get("name") || "").trim();

    const result = await addToWaitlist(email, name);
    return result.success
      ? { success: true as const }
      : {
          success: false as const,
          error: result.error || "Failed to add to waitlist",
        };
  };

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
                  "absolute transition-all duration-200 ease-in-out h-7 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70"
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
                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                    Pilot
                  </h1>
                </div>
                <div className="flex flex-col gap-2 mb-2">
                  <h2 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    join the waitlist
                  </h2>
                  <p className="text-pretty text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm md:text-base leading-relaxed">
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
                  <div className="text-muted-foreground text-xs sm:text-sm md:text-base [&>p]:tracking-tight [&>p]:leading-[1.6] [&>p:not(:last-child)]:mb-3 text-pretty text-start">
                    <p>
                      pilot started with a simple idea: to make building and
                      selling things online feel human again.
                    </p>
                    <p>
                      we&apos;re builders ourselves. we&apos;ve seen how most
                      &quot;tools&quot; end up making you work for them instead
                      of the other way around. everything&apos;s bloated,
                      over-automated, and focused on &quot;scaling.&quot; but
                      nobody seems to care about the people actually using these
                      tools day to day.
                    </p>
                    <p>pilot is our way of fixing that.</p>
                    <p>
                      we believe software should feel alive—simple enough to get
                      out of your way, yet smart enough to help you think. it
                      should make you faster, sharper, and more in control.
                      that&apos;s what we&apos;re building: tools that work with
                      you, not for you.
                    </p>
                    <p>
                      our approach is open by default. we learned everything
                      from open source and the people who share their work
                      online. so we&apos;re giving back to that world.
                      pilot&apos;s code, ideas, and progress will always be
                      transparent. no hype, no hiding behind &quot;coming
                      soon.&quot;
                    </p>
                    <p>
                      we care more about craft than clout. more about
                      consistency than virality. we&apos;ll take something
                      useful over something fancy any day.
                    </p>
                    <p>
                      this isn&apos;t about disrupting an industry or
                      &quot;changing the way creators work.&quot; it&apos;s
                      about making real, thoughtful software for people who give
                      a damn about what they&apos;re building.
                    </p>
                    <p>
                      we&apos;re still small. we&apos;re still figuring things
                      out. but that&apos;s the point. pilot isn&apos;t a product
                      you just launch—it&apos;s something you grow into.
                    </p>
                    <p>
                      and if you believe in that kind of building, you&apos;re
                      already part of the team.
                    </p>
                    <p>- the pilot team.</p>
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