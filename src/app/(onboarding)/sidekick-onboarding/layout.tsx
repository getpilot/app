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
      heading="Let's teach Sidekick how to sell like you."
      subheading="This takes 2 minutes. Then it'll run your DMs for you."
      footer="Sidekick is your AI sales assistant inside the Unified Inbox. It captures sales context, tone, FAQs and offers to help you close more deals."
    >
      {children}
    </OnboardingLayout>
  );
}