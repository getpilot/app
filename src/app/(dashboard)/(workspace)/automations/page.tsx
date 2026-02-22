import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import AutomationsList from "@/components/automations/list";
import AutomationsLogs from "@/components/automations/logs";
import { Skeleton } from "@/components/ui/skeleton";
import { SidekickLayout } from "@/components/sidekick/layout";

export default function AutomationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">Automations</h1>
          <p className="text-muted-foreground">
            Set up smart auto-replies that turn DMs into deals while you&apos;re busy
          </p>
        </div>
        <Button asChild className="mt-auto">
          <Link href="/automations/new">
            <Plus className="size-4" />
            New Automation
          </Link>
        </Button>
      </div>

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