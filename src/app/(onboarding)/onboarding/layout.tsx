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
      heading="Turn Instagram conversations into real leads."
      subheading="Pilot helps you track every DM, spot high-intent buyers, and follow up before leads go cold."
      footer="Quick setup now saves hours later. You can edit all of this anytime."
    >
      {children}
    </OnboardingLayout>
  );
}
