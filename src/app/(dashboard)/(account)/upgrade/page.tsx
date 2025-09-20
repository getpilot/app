"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { pricingPlans } from "@/lib/constants/pricing";
import { useState } from "react";
import { motion } from "motion/react";
import { handleCheckout } from "@/lib/polar/client";
import PlanBadge from "@/components/subscription-badge";
import { useRouter } from "next/navigation";

export default function UpgradePage() {
  const [isYearly, setIsYearly] = useState(false);
  const router = useRouter();

  return (
    <div className="relative my-auto">
      <div className="mx-auto max-w-5xl px-6">
        <PlanBadge />

        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold md:text-4xl lg:text-5xl mt-3">
            Stop losing money on missed deals
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance text-lg">
            Pick your plan and start closing more deals from your DMs today. No setup fees, cancel anytime.
          </p>
        </div>

        <div className="flex items-center justify-center mt-10">
          <div
            className="flex items-center justify-between bg-muted rounded-full relative w-[260px] border"
            role="radiogroup"
            aria-label="Billing frequency"
          >
            <button
              onClick={() => setIsYearly(false)}
              className="relative z-10 py-3 px-6 text-sm font-medium w-[130px] text-center"
              role="radio"
              aria-checked={!isYearly}
              aria-label="Monthly billing"
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className="relative z-10 py-3 px-6 text-sm font-medium w-[130px] text-center"
              role="radio"
              aria-checked={isYearly}
              aria-label="Yearly billing"
            >
              Yearly
            </button>
            <motion.div
              className="absolute z-0 rounded-full bg-primary text-primary-foreground"
              initial={false}
              animate={{ x: isYearly ? 130 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ width: 130, height: "100%" }}
            />
          </div>
        </div>

        <div className="@container relative mt-10">
          <Card className="@4xl:max-w-full relative mx-auto max-w-sm p-0 border-l-0">
            <div className="@4xl:grid-cols-2 grid">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.title}
                  className={
                    plan.highlighted
                      ? "ring-foreground/10 bg-background rounded-(--radius) @3xl:mx-0 @3xl:-my-3 -mx-1 border-transparent shadow ring-1"
                      : ""
                  }
                >
                  <div
                    className={
                      plan.highlighted
                        ? "@3xl:py-3 @3xl:px-0 relative px-1"
                        : ""
                    }
                  >
                    <CardHeader className="p-8">
                      <CardTitle className="font-medium text-lg">
                        {plan.title}
                      </CardTitle>
                      <p className="text-muted-foreground mt-2 text-base">
                        {plan.description}
                      </p>
                      <span className="mb-0.5 mt-4 block text-3xl font-semibold">
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        <span className="text-muted-foreground text-base font-normal ml-1">
                          / month
                        </span>
                      </span>
                      {isYearly && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Billed annually
                        </p>
                      )}
                    </CardHeader>
                    <div
                      className={`${
                        plan.highlighted ? "@3xl:mx-0 -mx-1 " : ""
                      }border-y px-8 py-4`}
                    >
                      <Button 
                        className="w-full" 
                        onClick={async () => {
                          if (plan.title === "Premium" || plan.title === "Starter") {
                            router.push("/sidekick-onboarding");
                          } else {
                            await handleCheckout(plan.title as "Starter" | "Premium", isYearly);
                          }
                        }}
                      >
                        Subscribe
                      </Button>
                    </div>

                    <ul role="list" className="space-y-3 p-8">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check
                            className="text-primary size-3"
                            strokeWidth={3.5}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}