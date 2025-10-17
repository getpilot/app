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
    await new Promise((r) => setTimeout(r, 500));
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false as const, error: "Please enter a valid email" };
    }

    if (!name) {
      return { success: false as const, error: "Please enter your name" };
    }

    const result = await addToWaitlist(email, name);

    if (result.success) {
      return { success: true as const };
    } else {
      return {
        success: false as const,
        error: result.error || "Failed to add to waitlist",
      };
    }
  };

  return (
    <div className="max-w-screen-sm mx-auto w-full flex flex-col min-h-screen">
      <div className="px-5 gap-8 flex flex-col flex-1 py-[12vh]">
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
                  "absolute transition-all duration-200 ease-in-out h-7 rounded-full bg-muted"
                )}
                style={{
                  width: `90px`,
                  left: activeTab === "waitlist" ? "4px" : "calc(90px + 4px)",
                }}
              />
              <button
                onClick={() => setActiveTab("waitlist")}
                className={`relative text-sm font-medium py-1 px-3 transition-colors duration-200 text-foreground w-[90px] flex items-center justify-center
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
                className={`relative text-sm font-medium py-1 px-3 transition-colors duration-200 text-foreground w-[90px] flex items-center justify-center
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
            <WaitlistWrapper>
              <div className="px-1 flex flex-col w-full self-stretch items-center text-center gap-4">
                <div className="flex justify-center w-full items-center mx-auto">
                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                    Pilot
                  </h1>
                </div>
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Join our waitlist
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm md:text-base leading-relaxed">
                    Be the first to know when we launch. No spam, unsubscribe
                    anytime.
                  </p>
                </div>
                <InputForm buttonCopy={buttonCopy} formAction={formAction} />
              </div>
            </WaitlistWrapper>
          ) : (
            <WaitlistWrapper className="max-w-[640px]">
              <ScrollArea className="w-full max-h-[60vh] pr-1">
                <div className="flex flex-col gap-8 w-full">
                  <h2
                    className={clsx(
                      "text-foreground text-6xl font-semibold text-pretty",
                      font.className
                    )}
                  >
                    the pilot manifesto
                  </h2>
                  <div className="text-muted-foreground [&>p]:tracking-tight [&>p]:leading-[1.6] [&>p:not(:last-child)]:mb-3 text-pretty text-start">
                    <p>
                      pilot started with a simple idea: to make building and
                      selling things online feel human again.
                    </p>
                    <p>
                      we're builders ourselves. we've seen how most "tools" end
                      up making you work for them instead of the other way
                      around. everything's bloated, over-automated, and focused
                      on "scaling." but nobody seems to care about the people
                      actually using these tools day to day.
                    </p>
                    <p>pilot is our way of fixing that.</p>
                    <p>
                      we believe software should feel alive—simple enough to get
                      out of your way, yet smart enough to help you think. it
                      should make you faster, sharper, and more in control.
                      that's what we're building: tools that work with you, not
                      for you.
                    </p>
                    <p>
                      our approach is open by default. we learned everything
                      from open source and the people who share their work
                      online. so we're giving back to that world. pilot's code,
                      ideas, and progress will always be transparent. no hype,
                      no hiding behind "coming soon."
                    </p>
                    <p>
                      we care more about craft than clout. more about
                      consistency than virality. we'll take something useful
                      over something fancy any day.
                    </p>
                    <p>
                      this isn't about disrupting an industry or "changing the
                      way creators work." it's about making real, thoughtful
                      software for people who give a damn about what they're
                      building.
                    </p>
                    <p>
                      we're still small. we're still figuring things out. but
                      that's the point. pilot isn't a product you just
                      launch—it's something you grow into.
                    </p>
                    <p>
                      and if you believe in that kind of building, you're
                      already part of the team.
                    </p>
                    <p>- the pilot team.</p>
                  </div>
                </div>
              </ScrollArea>
            </WaitlistWrapper>
          )}
        </main>
      </div>
    </div>
  );
}