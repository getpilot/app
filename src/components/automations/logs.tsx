import { getRecentAutomationLogs } from "@/actions/automations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Rocket, Timer, User2 } from "lucide-react";

export default async function AutomationsLogs() {
  const logs = await getRecentAutomationLogs(25);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Automation Activity</CardTitle>
        <CardDescription>
          latest executions of your automations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Rocket className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total actions</p>
              <p className="font-medium">{logs.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Timer className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last activity</p>
              <p className="font-medium">
                {logs[0]?.createdAt
                  ? new Date(logs[0].createdAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="rounded-md bg-primary/10 p-2">
              <User2 className="size-4 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unique recipients</p>
              <p className="font-medium">
                {new Set(logs.map((l) => l.recipientId)).size || 0}
              </p>
            </div>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <h4 className="font-medium">No recent automation activity</h4>
            <p className="text-sm text-muted-foreground">
              activity will appear here when automations trigger.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-fit max-h-[500px] pr-3 border p-2 rounded-lg">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase">
                        {log.action}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div className="rounded-md bg-muted/40 p-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Automation
                      </span>
                      <span className="font-medium">
                        {log.automationTitle || "—"}
                      </span>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Trigger
                      </span>
                      <span className="font-medium">&quot;{log.triggerWord}&quot;</span>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Recipient
                      </span>
                      <span className="text-xs font-medium">
                        {log.recipientUsername}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}