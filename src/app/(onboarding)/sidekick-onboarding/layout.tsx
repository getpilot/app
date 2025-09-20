import { ReactNode } from "react";
import OnboardingLayout from "@/components/onboarding-layout";

export default async function SidekickOnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OnboardingLayout
      title="Pilot Sidekick"
      heading="Teach your AI to sell exactly like you do."
      subheading="5 minutes to set up. Then watch it close deals while you sleep."
      footer="Sidekick learns your style, knows your offers, and handles your DMs so you can focus on what matters most."
    >
      {children}
    </OnboardingLayout>
  );
}