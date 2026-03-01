import { authClient } from "../auth-client";

type PlanTitle = "Starter" | "Premium";

const productMap: Record<PlanTitle, { monthly: string; yearly: string }> = {
  Starter: {
    monthly: "Pilot-Starter-Month",
    yearly: "Pilot-Starter-Annual",
  },
  Premium: {
    monthly: "Pilot-Premium-Month",
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
    console.error("Checkout error:", error);
    throw new Error(
      `Checkout failed for ${planTitle} (${isYearly ? "yearly" : "monthly"}): ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}