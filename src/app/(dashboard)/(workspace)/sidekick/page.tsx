import { redirect } from "next/navigation";
import { checkSidekickOnboardingStatus } from "@/actions/sidekick/onboarding";

export default async function SidekickPage() {
  const { sidekick_onboarding_complete } =
    await checkSidekickOnboardingStatus();

  if (!sidekick_onboarding_complete) {
    redirect("/sidekick-onboarding");
  }

  return <div>Sidekick</div>;
}