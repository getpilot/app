"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateSystemPrompt } from "@/actions/sidekick/settings";
import { toast } from "sonner";
import { DEFAULT_SIDEKICK_PROMPT } from "@/lib/constants/sidekick";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Undo2, Rocket, Timer, User2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getRecentSidekickActions } from "@/actions/sidekick/action-logs";

type SidekickSettings = {
  systemPrompt: string;
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

interface SidekickPanelProps {
  initialSettings: SidekickSettings | null;
}

export function SidekickPanel({ initialSettings }: SidekickPanelProps) {
  const [settings, setSettings] = useState<SidekickSettings>(
    initialSettings || {
      systemPrompt: DEFAULT_SIDEKICK_PROMPT,
    }
  );
  const [actions, setActions] = useState<SidekickAction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const data = await getRecentSidekickActions();
      setActions(data || []);
    } catch (error) {
      console.error("Failed to fetch actions:", error);
    }
  };

  const handleSavePrompt = async () => {
    setLoading(true);
    try {
      const result = await updateSystemPrompt(settings.systemPrompt);
      if (result.success) {
        toast.success("System prompt updated");
      } else {
        toast.error(result.error || "Failed to update prompt");
      }
    } catch (error) {
      toast.error("Failed to update prompt");
      console.error("Failed to update prompt:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefault = async () => {
    setSettings({ systemPrompt: DEFAULT_SIDEKICK_PROMPT });
    try {
      const result = await updateSystemPrompt(DEFAULT_SIDEKICK_PROMPT);

      if (result.success) {
        toast.success("Restored default prompt");
      } else {
        toast.error(result.error || "Failed to restore default prompt");
      }
    } catch (error) {
      toast.error("Failed to restore default prompt");
      console.error("Failed to restore default prompt:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const charCount = settings.systemPrompt.length;

  const Stat = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
  }) => (
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-balance">Sidekick Control</CardTitle>
        <CardDescription className="text-pretty">
          Train your AI assistant and see what it's been up to.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Stat icon={Rocket} label="Messages sent" value={actions.length} />
          <Stat
            icon={Timer}
            label="Last active"
            value={
              actions[0]?.createdAt
                ? new Date(actions[0].createdAt).toLocaleDateString()
                : "—"
            }
          />
          <Stat
            icon={User2}
            label="People helped"
            value={new Set(actions.map((a) => a.recipientId)).size || 0}
          />
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 border">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Sidekick's Instructions</h3>
                  <p className="text-xs text-muted-foreground">
                    Tell Sidekick how to behave. Be specific about what you want.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {charCount} chars
                </span>
              </div>

              <Textarea
                value={settings.systemPrompt}
                onChange={(e) =>
                  setSettings({ ...settings, systemPrompt: e.target.value })
                }
                placeholder="Tell Sidekick how to act. For example: 'Always be friendly and helpful. Ask about their goals before pitching. Keep responses under 2 sentences.'"
                rows={8}
                className="resize-none"
                aria-label="System prompt"
              />

              <div className="flex items-center gap-2">
                <Button onClick={handleSavePrompt} disabled={loading}>
                  <Save className="mr-2 size-4" aria-hidden="true" />
                  {loading ? "Saving..." : "Save Instructions"}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <Undo2 className="mr-2 size-4" aria-hidden="true" />
                      Reset to Default
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Reset Sidekick's Instructions?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will wipe out your custom instructions and go back to the default. You can't undo this.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetDefault}>
                        Reset to Default
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-2">
            {actions.length === 0 ? (
              <div className="rounded-lg border p-6 text-center">
                <h4 className="font-medium">No recent actions</h4>
                <p className="text-sm text-muted-foreground">
                  Actions will appear here once Sidekick starts responding.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing latest {actions.length}
                  </p>
                </div>
                <ScrollArea className="max-h-full h-[600px] pr-3 border mt-2 p-2 rounded-lg">
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

                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
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