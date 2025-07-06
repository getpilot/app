import { Polar } from "@polar-sh/sdk";
import { authClient } from "./auth-client";

export const polarInstance = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

type PlanTitle = "Starter" | "Premium";

const productMap: Record<PlanTitle, { monthly: string; yearly: string }> = {
  Starter: {
    monthly: "Pilot-Starter",
    yearly: "Pilot-Starter-Annual",
  },
  Premium: {
    monthly: "Pilot-Premium",
    yearly: "Pilot-Premium-Annual",
  },
};

export async function handleCheckout(planTitle: PlanTitle, isYearly: boolean) {
  const plan = productMap[planTitle];
  if (!plan)
    throw new Error(
      `Invalid plan title: ${planTitle}. Valid options are: ${Object.keys(
        productMap
      ).join(", ")}`
    );
  const productId = isYearly ? plan.yearly : plan.monthly;
  try {
    await authClient.checkout({ slug: productId });
  } catch (error) {
    throw new Error(
      `Checkout failed for ${planTitle} (${
        isYearly ? "yearly" : "monthly"
      }): ${error}`
    );
  }
}