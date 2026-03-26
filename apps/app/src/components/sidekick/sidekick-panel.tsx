"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Button } from "@pilot/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@pilot/ui/components/card";
import { Badge } from "@pilot/ui/components/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@pilot/ui/components/tabs";
import { ScrollArea } from "@pilot/ui/components/scroll-area";
import { Bot, RefreshCcw, Rocket, Timer, User2 } from "lucide-react";
import { toast } from "sonner";
import { getRecentSidekickActions } from "@/actions/sidekick/action-logs";
import { syncSidekickMemory } from "@/actions/sidekick/memory";

type SidekickOverview = {
  toneType: "friendly" | "direct" | "like_me" | "custom";
  toneSamples: number;
  totalContacts: number;
  seededContacts: number;
};

type SidekickAction = {
  id: string;
  platform: string;
  action: string;
  text: string;
  result: string;
  createdAt: string;
  recipientId: string;
  recipientUsername: string;
};

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="rounded-md bg-primary/10 p-2">
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

async function loadRecentActions(
  setActions: React.Dispatch<React.SetStateAction<SidekickAction[]>>,
) {
  try {
    setActions(await getRecentSidekickActions());
  } catch (error) {
    console.error("Failed to fetch actions:", error);
  }
}

interface SidekickPanelProps {
  initialOverview: SidekickOverview | null;
}

export function SidekickPanel({ initialOverview }: SidekickPanelProps) {
  const [overview] = useState<SidekickOverview>(
    initialOverview || {
      toneType: "friendly",
      toneSamples: 0,
      totalContacts: 0,
      seededContacts: 0,
    },
  );
  const [actions, setActions] = useState<SidekickAction[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadRecentActions(setActions);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleSyncMemory = async () => {
    setSyncing(true);

    let result: Awaited<ReturnType<typeof syncSidekickMemory>>;
    try {
      result = await syncSidekickMemory();
    } catch (error) {
      console.error("Failed to sync memory:", error);
      toast.error("Failed to queue memory sync.");
      setSyncing(false);
      return;
    }

    if (result.success) {
      toast.success("Queued a fresh memory sync.");
    } else {
      toast.error(result.error || "Failed to queue memory sync.");
    }

    setSyncing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-balance">Sidekick Control</CardTitle>
        <CardDescription className="text-pretty">
          Tone comes from onboarding. Durable business memory and DM thread recall are handled through Sidekick memory.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat icon={Rocket} label="Messages sent" value={actions.length} />
          <Stat
            icon={Timer}
            label="Last active"
            value={
              actions[0]?.createdAt
                ? new Date(actions[0].createdAt).toLocaleDateString()
                : "-"
            }
          />
          <Stat
            icon={User2}
            label="People helped"
            value={new Set(actions.map((action) => action.recipientId)).size || 0}
          />
        </div>

        <Tabs defaultValue="memory" className="w-full">
          <TabsList className="grid w-full grid-cols-2 border">
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="memory" className="mt-2 space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">Current Tone</h3>
                  <p className="text-xs text-muted-foreground">
                    Managed from Sidekick onboarding and tone training.
                  </p>
                </div>
                <Badge variant="outline" className="uppercase">
                  {overview.toneType}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Stored tone samples: {overview.toneSamples}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">Memory Coverage</h3>
                  <p className="text-xs text-muted-foreground">
                    Structured business knowledge syncs fully. DM thread history is seeded from active contacts.
                  </p>
                </div>
                <Bot className="size-4 text-primary" aria-hidden="true" />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Contacts with seeded memory</p>
                  <p className="text-lg font-medium">
                    {overview.seededContacts} / {overview.totalContacts}
                  </p>
                </div>
                <div className="rounded-md bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Structured knowledge</p>
                  <p className="text-lg font-medium">Always synced</p>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleSyncMemory} disabled={syncing}>
                  <RefreshCcw className="size-4" aria-hidden="true" />
                  {syncing ? "Queueing..." : "Sync Memory"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-2">
            {actions.length === 0 ? (
              <div className="rounded-lg border p-6 text-center">
                <h4 className="font-medium">No recent actions</h4>
                <p className="text-sm text-muted-foreground">
                  Actions appear here after Sidekick sends replies.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing latest {actions.length}
                  </p>
                </div>
                <ScrollArea className="mt-2 h-[600px] max-h-full rounded-lg border p-2 pr-3">
                  <div className="space-y-3">
                    {actions.map((action) => (
                      <div key={action.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="uppercase">
                              {action.action}
                            </Badge>
                            <Badge className="bg-green-100 text-green-800">
                              Sent
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(action.createdAt)}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {action.text}
                        </p>

                        <div className="mt-3">
                          <div className="flex items-center justify-between rounded-md bg-muted/40 p-2">
                            <span className="text-xs text-muted-foreground">
                              Recipient
                            </span>
                            <span className="text-xs font-medium">
                              {action.recipientUsername}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
