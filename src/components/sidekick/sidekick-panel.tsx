"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateSystemPrompt } from "@/actions/sidekick/settings";
import { toast } from "sonner";

type SidekickSettings = {
  systemPrompt: string;
};

type SidekickAction = {
  id: string;
  platform: string;
  action: string;
  text: string;
  confidence: number;
  result: string;
  createdAt: string;
  recipientId: string;
};

interface SidekickPanelProps {
  initialSettings: SidekickSettings | null;
}

export function SidekickPanel({ initialSettings }: SidekickPanelProps) {
  const [settings, setSettings] = useState<SidekickSettings>(
    initialSettings || {
      systemPrompt:
        "You are a friendly, professional assistant focused on qualifying leads and helping with business inquiries.",
    }
  );
  const [actions, setActions] = useState<SidekickAction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const response = await fetch("/api/sidekick/actions");
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error("Failed to fetch actions:", error);
    }
  };

  const handleSavePrompt = async () => {
    setLoading(true);
    try {
      const result = await updateSystemPrompt(settings.systemPrompt);
      if (result.success) {
        toast.success("System prompt updated successfully");
      } else {
        toast.error(result.error || "Failed to update prompt");
      }
    } catch (error) {
      toast.error("Failed to update prompt");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* System Prompt Editor */}
      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={settings.systemPrompt}
            onChange={(e) =>
              setSettings({ ...settings, systemPrompt: e.target.value })
            }
            placeholder="Enter your system prompt..."
            rows={6}
            className="resize-none"
          />
          <Button onClick={handleSavePrompt} disabled={loading}>
            {loading ? "Saving..." : "Save Prompt"}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <p className="text-muted-foreground">No recent actions</p>
          ) : (
            <div className="space-y-3">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{action.action}</Badge>
                    <Badge className="bg-green-100 text-green-800">
                      Sent
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{action.text}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(action.createdAt)}</span>
                    <span>To: {action.recipientId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}