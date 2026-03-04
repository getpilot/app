import { authClient } from "../auth-client";
import {
  type PaidPlanId,
  getCheckoutConfig,
  getPricingPlan,
} from "@/lib/constants/pricing";

export async function handleCheckout(planId: PaidPlanId, isYearly: boolean) {
  const checkoutConfig = getCheckoutConfig(planId, isYearly);

  if (!checkoutConfig) {
    const plan = getPricingPlan(planId);
    throw new Error(
      `${plan.title} ${isYearly ? "yearly" : "monthly"} checkout is not configured in pricing.ts yet.`,
    );
  }

  try {
    await authClient.checkout({ slug: checkoutConfig.slug });
  } catch (error) {
    console.error("Checkout error:", error);
    throw new Error(
      `Checkout failed for ${planId} (${isYearly ? "yearly" : "monthly"}): ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
