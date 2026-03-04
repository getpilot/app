import { polarInstance } from "@/lib/polar/server";
import {
  type PlanId,
  getPricingPlan,
  resolvePlanIdFromProductId,
} from "@/lib/constants/pricing";

export async function getCurrentPlan(userId: string): Promise<PlanId> {
  try {
    const customerState = await polarInstance.customers.getStateExternal({
      externalId: userId,
    });
    const activeProductId = customerState.activeSubscriptions?.[0]?.productId;

    return resolvePlanIdFromProductId(activeProductId);
  } catch (error) {
    console.error("Failed to resolve Polar plan, defaulting to free", error);
    return "free";
  }
}

export function getPlanLimits(planId: PlanId) {
  return getPricingPlan(planId).limits;
}
