"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleAutomation, deleteAutomation } from "@/actions/automations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Automation } from "@/actions/automations";
import { toast } from "sonner";

export function AutomationCard({ automation }: { automation: Automation }) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleAutomation(automation.id);
      toast.success(`Automation ${automation.isActive ? 'disabled' : 'enabled'} successfully`);
      router.refresh();
    } catch {
      toast.error("Failed to toggle automation");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this automation? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAutomation(automation.id);
      toast.success("Automation deleted successfully");
      router.refresh();
    } catch {
      toast.error("Failed to delete automation");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{automation.title}</CardTitle>
            {automation.description && (
              <CardDescription>{automation.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={automation.isActive ? "default" : "secondary"}>
              {automation.isActive ? "Active" : "Inactive"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/automations/${automation.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Trigger Word</p>
            <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
              "{automation.triggerWord}"
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Response Type</p>
            <Badge variant="outline">
              {automation.responseType === "fixed" ? "Fixed Message" : "AI Prompt"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={automation.isActive || false}
                onCheckedChange={handleToggle}
                disabled={isToggling}
              />
              <span className="text-sm">
                {automation.isActive ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
        {automation.expiresAt && (
          <div className="mt-4">
            <p className="text-sm font-medium text-muted-foreground">Expires</p>
            <p className="text-sm">
              {new Date(automation.expiresAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}