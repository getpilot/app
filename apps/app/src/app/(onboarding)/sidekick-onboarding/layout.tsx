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
      heading="Teach Sidekick how you sell."
      subheading="Share your offer, FAQs, and tone so replies stay accurate and sound like you."
      footer="This takes a few minutes and makes every follow-up faster."
    >
      {children}
    </OnboardingLayout>
  );
}
