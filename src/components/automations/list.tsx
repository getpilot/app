import { getAutomations } from "@/actions/automations";
import { Button } from "@/components/ui/button";
import { Plus, Zap, Percent, MessageSquare, Brain } from "lucide-react";
import Link from "next/link";
import { AutomationCard } from "@/components/automations/card";
import {
  Card,
  CardTitle,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function AutomationsList() {
  const automations = await getAutomations();

  if (automations.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 border rounded-lg p-4">
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Automations</CardTitle>
        <CardDescription>manage your instagram dm automations</CardDescription>
      </CardHeader>
      <CardContent>
        {/* quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* activation rate */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Percent className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Activation rate</p>
              <p className="font-medium">
                {(() => {
                  const total = automations.length;
                  const active = automations.filter((a) => !!a.isActive).length;
                  return total === 0 ? "0%" : `${Math.round((active / total) * 100)}%`;
                })()}
              </p>
            </div>
          </div>

          {/* avg comment replies per automation */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="rounded-md bg-primary/10 p-2">
              <MessageSquare className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg comment replies/automation</p>
              <p className="font-medium">
                {(() => {
                  const total = automations.length;
                  const sum = automations.reduce((acc, a) => acc + (a.commentReplyCount ?? 0), 0);
                  const avg = total === 0 ? 0 : sum / total;
                  return avg.toFixed(2);
                })()}
              </p>
            </div>
          </div>

          {/* ai-driven automations */}
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Brain className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">AI-driven automations</p>
              <p className="font-medium">
                {automations.filter((a) => a.responseType === "ai_prompt").length}
              </p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[500px] pr-3 border p-2 rounded-lg">
          <div className="space-y-4">
            {automations.map((automation) => (
              <AutomationCard key={automation.id} automation={automation} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}