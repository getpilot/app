export interface PricingPlan {
  title: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    title: "Starter",
    description: "For solo creators and small teams",
    monthlyPrice: "$35",
    yearlyPrice: "$29",
    highlighted: true,
    features: [
      "Lead tagging and scoring",
      "AI-assisted DM replies",
      "Contacts and conversation history",
      "Follow-up suggestions",
      "Email support",
    ],
  },
  {
    title: "Premium",
    description: "For growing teams with higher volume",
    monthlyPrice: "$59",
    yearlyPrice: "$49",
    features: [
      "Everything in Starter, plus:",
      "Priority lead views",
      "Advanced performance insights",
      "Payment platform sync",
      "More AI automation capacity",
      "Priority support",
    ],
  },
];
