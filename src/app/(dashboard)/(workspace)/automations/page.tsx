import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import AutomationsList from "@/components/automations/list";

export default function AutomationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-muted-foreground">
            Set up automated responses for Instagram DMs based on trigger words
          </p>
        </div>
        <Button asChild className="mt-auto">
          <Link href="/automations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Automation
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>Loading automations...</div>}>
        <AutomationsList />
      </Suspense>
    </div>
  );
}