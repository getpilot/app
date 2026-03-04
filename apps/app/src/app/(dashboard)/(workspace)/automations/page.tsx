import { Suspense } from "react";
import { Button } from "@pilot/ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import AutomationsList from "@/components/automations/list";
import AutomationsLogs from "@/components/automations/logs";
import { Skeleton } from "@pilot/ui/components/skeleton";
import { SidekickLayout } from "@/components/sidekick/layout";
import { getUser } from "@/lib/auth-utils";
import { getBillingStatus } from "@/lib/billing/enforce";

export default async function AutomationsPage() {
  const user = await getUser();
  const billingStatus = user ? await getBillingStatus(user.id) : null;
  const isFrozen = billingStatus?.flags.isStructurallyFrozen ?? false;
  const canCreateAutomation = billingStatus?.flags.canCreateAutomation ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Automations</h1>
          <p className="text-muted-foreground">
            Build automated replies for common DM and comment questions.
          </p>
        </div>
        {canCreateAutomation ? (
          <Button asChild className="mt-auto">
            <Link href="/automations/new">
              <Plus className="size-4" />
              New Automation
            </Link>
          </Button>
        ) : (
          <Button className="mt-auto" disabled>
            <Plus className="size-4" />
            New Automation
          </Button>
        )}
      </div>

      {isFrozen && (
        <p className="text-sm text-muted-foreground">
          Your workspace is frozen because it is above the current plan cap. Existing automations remain visible, but changes are disabled until usage is reduced or the plan is upgraded.
        </p>
      )}

      <SidekickLayout>
        <Suspense
          fallback={
            <div className="w-full max-w-xl">
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="mt-4 space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          }
        >
          <AutomationsLogs />
        </Suspense>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          }
        >
          <AutomationsList />
        </Suspense>
      </SidekickLayout>
    </div>
  );
}
