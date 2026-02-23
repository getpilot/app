import { redirect } from "next/navigation";
import { checkSidekickOnboardingStatus } from "@/actions/sidekick/onboarding";
import { getSidekickSettings } from "@/actions/sidekick/settings";
import { SidekickPanel } from "@/components/sidekick/sidekick-panel";
import { FollowUpList } from "@/components/sidekick/follow-up-list";
import { HRNList } from "@/components/sidekick/hrn-list";
import { SidekickLayout } from "@/components/sidekick/layout";

export const dynamic = "force-dynamic";

export default async function SidekickPage() {
  const { sidekick_onboarding_complete } =
    await checkSidekickOnboardingStatus();

  if (!sidekick_onboarding_complete) {
    redirect("/sidekick-onboarding");
  }

  let settings = null;
  let hasError = false;
  try {
    const settingsResult = await getSidekickSettings();
    if (settingsResult.success && settingsResult.settings) {
      settings = settingsResult.settings;
    }
  } catch (error) {
    console.error("Error in SidekickPage:", error);
    hasError = true;
  }

  if (hasError) {
    return (
      <main className="w-full px-4 md:px-6 py-6 md:py-10 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Sidekick</h1>
        <p className="text-destructive">
          Failed to load sidekick settings. Please try again later.
        </p>
      </main>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold font-heading tracking-tight">Sidekick</h1>
        <p className="text-muted-foreground mt-2">
          Your AI sales assistant that handles your DMs while you sleep. It learns your style, knows your offers, and closes deals automatically.
        </p>
      </div>

      <SidekickLayout>
        <SidekickPanel initialSettings={settings} />
        <div className="space-y-4">
          <FollowUpList />
          <HRNList />
        </div>
      </SidekickLayout>
    </div>
  );
}
