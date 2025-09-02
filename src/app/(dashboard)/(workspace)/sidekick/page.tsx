import { redirect } from "next/navigation";
import { checkSidekickOnboardingStatus } from "@/actions/sidekick/onboarding";
import { getSidekickSettings } from "@/actions/sidekick/settings";
import { SidekickPanel } from "@/components/sidekick/sidekick-panel";
import { FollowUpList } from "@/components/sidekick/follow-up-list";

export default async function SidekickPage() {
  const { sidekick_onboarding_complete } =
    await checkSidekickOnboardingStatus();

  if (!sidekick_onboarding_complete) {
    redirect("/sidekick-onboarding");
  }

  const settingsResult = await getSidekickSettings();
  const settings = settingsResult.success ? settingsResult.settings : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sidekick</h1>
      <SidekickPanel initialSettings={settings || null} />
      <FollowUpList />
    </div>
  );
}