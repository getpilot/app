import { getAutomations } from "@/actions/automations";
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";
import Link from "next/link";
import { AutomationCard } from "@/components/automations/card";

export default async function AutomationsList() {
  const automations = await getAutomations();

  if (automations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg p-4">
        <div className="text-center">
          <Zap className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No automations yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first automation to automatically respond to Instagram
            DMs
          </p>
          <Button asChild className="mt-4">
            <Link href="/automations/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Automation
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {automations.map((automation) => (
        <AutomationCard key={automation.id} automation={automation} />
      ))}
    </div>
  );
}