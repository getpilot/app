import { ReactNode } from "react";
import OnboardingLayout from "@/components/onboarding-layout";

export default async function RegularOnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OnboardingLayout
      title="Pilot"
      heading="A few clicks away from creating your AI-first CRM workspace."
      subheading="Pilot is an AI-first CRM that qualifies, tags, and follows up on leads without a real-time unified inbox."
      footer="Built for creators closing deals in DMs, Pilot acts like an intelligent sales assistant: it listens, learns tone, and executes, freeing up time and mental overhead."
    >
      {children}
    </OnboardingLayout>
  );
}