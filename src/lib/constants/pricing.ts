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
    description: "Perfect for creators just getting started",
    monthlyPrice: "$35",
    yearlyPrice: "$29",
    highlighted: true,
    features: [
      "Never lose a lead again (smart tagging)",
      "AI writes your replies (sounds like you)",
      "Track every deal & conversation",
      "Follow up automatically",
      "Email support when you need it",
    ],
  },
  {
    title: "Premium",
    description: "For serious creators & agencies",
    monthlyPrice: "$59",
    yearlyPrice: "$49",
    features: [
      "Everything in Starter, plus:",
      "See your hottest leads first",
      "Know exactly where you're losing money",
      "Syncs with your payment platforms",
      "AI handles everything (you just cash checks)",
      "Skip the line support",
    ],
  },
];