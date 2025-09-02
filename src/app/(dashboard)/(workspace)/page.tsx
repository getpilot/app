import { redirect } from "next/navigation";
import { checkSidekickOnboardingStatus } from "@/actions/sidekick/onboarding";
import { getSidekickSettings } from "@/actions/sidekick/settings";
import { SidekickPanel } from "@/components/sidekick/sidekick-panel";
import { FollowUpList } from "@/components/sidekick/follow-up-list";

export const dynamic = "force-dynamic";

export default async function SidekickPage() {
  const { sidekick_onboarding_complete } =
    await checkSidekickOnboardingStatus();

  if (!sidekick_onboarding_complete) {
    redirect("/sidekick-onboarding");
  }

  try {
    const settingsResult = await getSidekickSettings();
    const settings =
      settingsResult.success && settingsResult.settings
        ? settingsResult.settings
        : null;

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Sidekick</h1>
          <p className="text-muted-foreground mt-2">
            Your AI assistant that automatically replies to messages and manages
            conversations.
          </p>
        </div>

        <SidekickPanel initialSettings={settings} />
        <FollowUpList />
      </div>
    );
  } catch (error) {
    console.error("Error in SidekickPage:", error);
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Sidekick</h1>
          <p className="text-destructive">
            Failed to load sidekick settings. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}