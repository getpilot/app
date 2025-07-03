import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pricingPlans } from "@/lib/constants/pricing";

export default function UpgradePage() {
  return (
    <div className="relative my-auto">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold md:text-4xl lg:text-5xl">
            Pricing that scale with your business
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance text-lg">
            Choose the perfect plan for your needs and start optimizing your
            workflow today
          </p>
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
                      <CardTitle className="font-medium">
                        {plan.title}
                      </CardTitle>
                      <span className="mb-0.5 mt-2 block text-2xl font-semibold">
                        {plan.price}
                      </span>
                    </CardHeader>
                    <div
                      className={`${
                        plan.highlighted ? "@3xl:mx-0 -mx-1 " : ""
                      }border-y px-8 py-4`}
                    >
                      <Button asChild className="w-full">
                        <Link href={plan.buttonLink}>Subscribe</Link>
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