import { getRecentAutomationLogs } from "@/actions/automations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function AutomationsLogs() {
  const logs = await getRecentAutomationLogs(25);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Automation Activity</CardTitle>
        <CardDescription>latest executions of your automations.</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <h4 className="font-medium">No recent automation activity</h4>
            <p className="text-sm text-muted-foreground">activity will appear here when automations trigger.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-full h-[500px] pr-3 border p-2 rounded-lg">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase">
                        {log.deliveryStatus}
                      </Badge>
                      <Badge className={log.responseSent ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {log.responseSent ? "Sent" : "Failed"}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-muted/40 p-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Automation</span>
                      <span className="font-medium">{log.automationTitle || "—"}</span>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Trigger</span>
                      <span className="font-medium">"{log.triggerWord}"</span>
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