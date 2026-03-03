export type PlanId = "free" | "starter" | "growth" | "pro";
export type PaidPlanId = Exclude<PlanId, "free">;

export interface BillingLimits {
  maxContactsTotal: number | null;
  maxNewContactsPerMonth: number | null;
  maxAutomations: number | null;
  maxSidekickSendsPerMonth: number | null;
  maxSidekickChatPromptsPerMonth: number | null;
}

export interface PricingPlan {
  planId: PlanId;
  title: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number | null;
  displayMonthlyPrice: string;
  displayYearlyPrice: string | null;
  features: string[];
  highlighted?: boolean;
  polar: {
    monthlyProductId: string | null;
    monthlySlug: string | null;
    yearlyProductId: string | null;
    yearlySlug: string | null;
  };
  limits: BillingLimits;
}

export const pricingPlans: PricingPlan[] = [
  {
    planId: "free",
    title: "Free",
    description: "Use the core workflow with strict caps.",
    monthlyPriceCents: 0,
    yearlyPriceCents: null,
    displayMonthlyPrice: "$0",
    displayYearlyPrice: null,
    features: [
      "Max 100 contacts",
      "1 automation flow",
      "3 AI sends per month",
      "Basic Sidekick and automation access",
      "3 day analytics",
    ],
    polar: {
      monthlyProductId: null,
      monthlySlug: null,
      yearlyProductId: null,
      yearlySlug: null,
    },
    limits: {
      maxContactsTotal: 100,
      maxNewContactsPerMonth: 25, // TODO: tune this placeholder
      maxAutomations: 1,
      maxSidekickSendsPerMonth: 3,
      maxSidekickChatPromptsPerMonth: 5, // TODO: tune this placeholder
    },
  },
  {
    planId: "starter",
    title: "Starter",
    description: "For creators handling a modest volume.",
    monthlyPriceCents: 1900,
    yearlyPriceCents: null,
    displayMonthlyPrice: "$19",
    displayYearlyPrice: null,
    highlighted: true,
    features: [
      "Max 500 contacts",
      "3 automation flows",
      "100 Sidekick chat prompts per month",
      "Drafting only, no in-app sends",
      "14 day analytics",
    ],
    polar: {
      monthlyProductId: null, // TODO: set after creating the Polar product
      monthlySlug: null, // TODO: set after creating the Polar product
      yearlyProductId: null, // TODO: set if you add a yearly product
      yearlySlug: null, // TODO: set if you add a yearly product
    },
    limits: {
      maxContactsTotal: 500,
      maxNewContactsPerMonth: 100, // TODO: tune this placeholder
      maxAutomations: 3,
      maxSidekickSendsPerMonth: 0,
      maxSidekickChatPromptsPerMonth: 100,
    },
  },
  {
    planId: "growth",
    title: "Growth",
    description: "For growing teams that need more headroom.",
    monthlyPriceCents: 3900,
    yearlyPriceCents: null,
    displayMonthlyPrice: "$39",
    displayYearlyPrice: null,
    features: [
      "Max 5,000 contacts",
      "Unlimited automation count",
      "300 Sidekick chat prompts per month",
      "Drafting only, no in-app sends",
      "30 day analytics",
    ],
    polar: {
      monthlyProductId: null, // TODO: set after creating the Polar product
      monthlySlug: null, // TODO: set after creating the Polar product
      yearlyProductId: null, // TODO: set if you add a yearly product
      yearlySlug: null, // TODO: set if you add a yearly product
    },
    limits: {
      maxContactsTotal: 5000,
      maxNewContactsPerMonth: 1000, // TODO: tune this placeholder
      maxAutomations: null,
      maxSidekickSendsPerMonth: 0,
      maxSidekickChatPromptsPerMonth: 300,
    },
  },
  {
    planId: "pro",
    title: "Pro",
    description: "For high-volume teams that need the full range.",
    monthlyPriceCents: 4900,
    yearlyPriceCents: null,
    displayMonthlyPrice: "$49",
    displayYearlyPrice: null,
    features: [
      "Max 50,000 contacts",
      "Unlimited automation count",
      "Unlimited Sidekick usage",
      "Priority support",
      "Full analytics",
    ],
    polar: {
      monthlyProductId: null, // TODO: set after creating the Polar product
      monthlySlug: null, // TODO: set after creating the Polar product
      yearlyProductId: null, // TODO: set if you add a yearly product
      yearlySlug: null, // TODO: set if you add a yearly product
    },
    limits: {
      maxContactsTotal: 50000,
      maxNewContactsPerMonth: 10000, // TODO: tune this placeholder
      maxAutomations: null,
      maxSidekickSendsPerMonth: null,
      maxSidekickChatPromptsPerMonth: null,
    },
  },
];

export const pricingPlanMap = pricingPlans.reduce(
  (acc, plan) => {
    acc[plan.planId] = plan;
    return acc;
  },
  {} as Record<PlanId, PricingPlan>,
);

export function getPricingPlan(planId: PlanId): PricingPlan {
  return pricingPlanMap[planId];
}

export function getPaidPricingPlans(): PricingPlan[] {
  return pricingPlans.filter((plan) => plan.planId !== "free");
}

export function isPaidPlanId(planId: PlanId): planId is PaidPlanId {
  return planId !== "free";
}

export function resolvePlanIdFromProductId(
  productId: string | null | undefined,
): PlanId {
  if (!productId) {
    return "free";
  }

  const matchedPlan = getPaidPricingPlans().find(
    (plan) =>
      plan.polar.monthlyProductId === productId ||
      plan.polar.yearlyProductId === productId,
  );

  return matchedPlan?.planId ?? "free";
}

export function getCheckoutConfig(
  planId: PaidPlanId,
  isYearly: boolean,
): { slug: string; productId: string } | null {
  const plan = getPricingPlan(planId);
  const slug = isYearly ? plan.polar.yearlySlug : plan.polar.monthlySlug;
  const productId = isYearly
    ? plan.polar.yearlyProductId
    : plan.polar.monthlyProductId;

  if (!slug || !productId) {
    return null;
  }

  return { slug, productId };
}

export function hasAnyYearlyPricing(): boolean {
  return getPaidPricingPlans().some(
    (plan) => plan.yearlyPriceCents !== null && plan.displayYearlyPrice !== null,
  );
}

export function formatPlanPrice(plan: PricingPlan, isYearly: boolean): string {
  if (isYearly && plan.displayYearlyPrice) {
    return plan.displayYearlyPrice;
  }

  return plan.displayMonthlyPrice;
}
