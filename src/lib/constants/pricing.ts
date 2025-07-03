export interface PricingPlan {
  title: string;
  price: string;
  buttonLink: string;
  features: string[];
  highlighted?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    title: "Pro",
    price: "$49 / mo",
    buttonLink: "#",
    highlighted: true,
    features: [
      "Everything in Free Plan",
      "5GB Cloud Storage",
      "Email and Chat Support",
      "Access to Community Forum",
      "Single User Access",
      "Access to Basic Templates",
      "Mobile App Access",
      "1 Custom Report Per Month",
      "Monthly Product Updates",
      "Standard Security Features",
    ],
  },
  {
    title: "Pro Plus",
    price: "$79 / mo",
    buttonLink: "#",
    features: [
      "Everything in Pro Plan",
      "5GB Cloud Storage",
      "Email and Chat Support",
    ],
  },
];