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

function formatLimitValue(value: number | null, singular: string): string {
  if (value === null) {
    return `Unlimited ${singular}s`;
  }

  return `Up to ${value.toLocaleString()} ${singular}${value === 1 ? "" : "s"}`;
}

function getPlanFeaturesFromLimits(limits: BillingLimits): string[] {
  return [
    formatLimitValue(limits.maxContactsTotal, "contact"),
    limits.maxAutomations === null
      ? "Unlimited automations"
      : `Up to ${limits.maxAutomations.toLocaleString()} automation${
          limits.maxAutomations === 1 ? "" : "s"
        }`,
    limits.maxNewContactsPerMonth === null
      ? "Unlimited new contacts per month"
      : `Up to ${limits.maxNewContactsPerMonth.toLocaleString()} new contacts per month`,
    limits.maxSidekickSendsPerMonth === null
      ? "Unlimited AI sends per month"
      : `Up to ${limits.maxSidekickSendsPerMonth.toLocaleString()} AI sends per month`,
    limits.maxSidekickChatPromptsPerMonth === null
      ? "Unlimited Sidekick chats per month"
      : `Up to ${limits.maxSidekickChatPromptsPerMonth.toLocaleString()} Sidekick chats per month`,
  ];
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
    features: getPlanFeaturesFromLimits({
      maxContactsTotal: 50,
      maxNewContactsPerMonth: 10,
      maxAutomations: 1,
      maxSidekickSendsPerMonth: 10,
      maxSidekickChatPromptsPerMonth: 3,
    }),
    polar: {
      monthlyProductId: null,
      monthlySlug: null,
      yearlyProductId: null,
      yearlySlug: null,
    },
    limits: {
      maxContactsTotal: 50,
      maxNewContactsPerMonth: 10,
      maxAutomations: 1,
      maxSidekickSendsPerMonth: 10,
      maxSidekickChatPromptsPerMonth: 3,
    },
  },
  {
    planId: "starter",
    title: "Starter",
    description: "For creators handling a modest volume.",
    monthlyPriceCents: 1900,
    yearlyPriceCents: 1520,
    displayMonthlyPrice: "$19",
    displayYearlyPrice: "$15.20",
    highlighted: true,
    features: getPlanFeaturesFromLimits({
      maxContactsTotal: 2000,
      maxNewContactsPerMonth: 500,
      maxAutomations: 3,
      maxSidekickSendsPerMonth: 1000,
      maxSidekickChatPromptsPerMonth: 100,
    }),
    polar: {
      monthlyProductId: "735f6aeb-6071-4dd0-a777-af4b34b1df86",
      monthlySlug: "starter-monthly",
      yearlyProductId: "c7c3c1c6-2050-46ab-b5af-f9c3b3230507",
      yearlySlug: "starter-yearly",
    },
    limits: {
      maxContactsTotal: 2000,
      maxNewContactsPerMonth: 500,
      maxAutomations: 3,
      maxSidekickSendsPerMonth: 1000,
      maxSidekickChatPromptsPerMonth: 100,
    },
  },
  {
    planId: "growth",
    title: "Growth",
    description: "For growing teams that need more headroom.",
    monthlyPriceCents: 3900,
    yearlyPriceCents: 3120,
    displayMonthlyPrice: "$39",
    displayYearlyPrice: "$31.20",
    features: getPlanFeaturesFromLimits({
      maxContactsTotal: 5000,
      maxNewContactsPerMonth: 2000,
      maxAutomations: null,
      maxSidekickSendsPerMonth: 2500,
      maxSidekickChatPromptsPerMonth: 300,
    }),
    polar: {
      monthlyProductId: "55f0cbfe-8ce4-48f0-bf6b-4cd2f0421cab",
      monthlySlug: "growth-monthly",
      yearlyProductId: "0e7bf5dd-2054-4a66-aa75-210a29774401",
      yearlySlug: "growth-yearly",
    },
    limits: {
      maxContactsTotal: 5000,
      maxNewContactsPerMonth: 2000,
      maxAutomations: null,
      maxSidekickSendsPerMonth: 2500,
      maxSidekickChatPromptsPerMonth: 300,
    },
  },
  {
    planId: "pro",
    title: "Pro",
    description: "For high-volume teams that need the full range.",
    monthlyPriceCents: 4900,
    yearlyPriceCents: 3920,
    displayMonthlyPrice: "$49",
    displayYearlyPrice: "$39.20",
    features: getPlanFeaturesFromLimits({
      maxContactsTotal: 10000,
      maxNewContactsPerMonth: 5000,
      maxAutomations: null,
      maxSidekickSendsPerMonth: 6000,
      maxSidekickChatPromptsPerMonth: 500,
    }),
    polar: {
      monthlyProductId: "8eb0a30e-fa30-4cbd-81dd-d03496041c85",
      monthlySlug: "pro-monthly",
      yearlyProductId: "e78999c4-f0ec-4c11-9595-2df220c5a95c",
      yearlySlug: "pro-yearly",
    },
    limits: {
      maxContactsTotal: 10000,
      maxNewContactsPerMonth: 5000,
      maxAutomations: null,
      maxSidekickSendsPerMonth: 6000,
      maxSidekickChatPromptsPerMonth: 500,
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
