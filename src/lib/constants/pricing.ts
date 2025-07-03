export interface PricingPlan {
  title: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  buttonLink: string;
  features: string[];
  highlighted?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    title: "Starter",
    description: "For solo creators & small teams",
    monthlyPrice: "$49",
    yearlyPrice: "$39",
    buttonLink: "#",
    highlighted: true,
    features: [
      "Smart tagging + lead qualification",
      "Sidekick Lite — AI drafts replies",
      "Deal & lead tracking",
      "Manual follow-ups",
      "Email support",
    ],
  },
  {
    title: "Premium",
    description: "For agencies & high-volume creators",
    monthlyPrice: "$79",
    yearlyPrice: "$69",
    buttonLink: "#",
    features: [
      "Everything in Starter, plus,",
      "Smart filters, priority inbox, lead scoring",
      "Pipeline & revenue analytics",
      "Auto-sync w/ Whop, Gumroad, Skool",
      "Fully automated AI replies + follow-ups (Sidekick Pro)",
      "Priority support",
    ],
  },
];