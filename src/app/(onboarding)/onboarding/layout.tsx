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
      heading="Stop losing deals in your DMs. Start closing them."
      subheading="Pilot turns your Instagram DMs into a sales machine. It reads every message, knows who's serious, and helps you close more deals without the chaos."
      footer="Finally, a CRM that actually gets how creators sell. No more missed opportunities or awkward follow-ups."
    >
      {children}
    </OnboardingLayout>
  );
}