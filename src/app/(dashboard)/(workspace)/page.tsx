import { redirect } from "next/navigation";
import { checkSidekickOnboardingStatus } from "@/actions/sidekick/onboarding";
import { getSidekickSettings } from "@/actions/sidekick/settings";
import { SidekickPanel } from "@/components/sidekick/sidekick-panel";
import { FollowUpList } from "@/components/sidekick/follow-up-list";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";

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
      <main className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-10 space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
              Sidekick
            </h1>
          </div>
          <p className="text-muted-foreground text-pretty">
            Your AI assistant that automatically replies to messages and manages
            conversations. Configure behavior and review automated activity in
            one place.
          </p>
        </header>

        <Separator />

        <section className="space-y-6">
          <SidekickPanel initialSettings={settings} />
          <FollowUpList />
        </section>
      </main>
    );
  } catch (error) {
    console.error("Error in SidekickPage:", error);
    return (
      <main className="mx-auto max-w-5xl px-4 md:px-6 py-6 md:py-10 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Sidekick</h1>
        <p className="text-destructive">
          Failed to load sidekick settings. Please try again later.
        </p>
      </main>
    );
  }
}