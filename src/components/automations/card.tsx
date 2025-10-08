"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleAutomation, deleteAutomation } from "@/actions/automations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Automation } from "@/actions/automations";
import { toast } from "sonner";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function AutomationCard({ automation }: { automation: Automation }) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleAutomation(automation.id);
      toast.success(
        `Automation ${
          automation.isActive ? "disabled" : "enabled"
        } successfully`
      );
      router.refresh();
    } catch {
      toast.error("Couldn't toggle automation. Try again?");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAutomation(automation.id);
      toast.success("Automation deleted! It's gone for good.");
      router.refresh();
    } catch {
      toast.error("Failed to delete automation");
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerScope = (automation as Automation).triggerScope || "dm";

  return (
    <Card className="group transition-all duration-200">
      <Collapsible>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-foreground truncate">
                  {automation.title}
                </CardTitle>
                <Badge
                  variant={automation.isActive ? "default" : "secondary"}
                  className={
                    automation.isActive
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-800"
                      : "border-border"
                  }
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      automation.isActive
                        ? "bg-emerald-500"
                        : "bg-muted-foreground"
                    }`}
                  />
                  {automation.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {automation.description && (
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {automation.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/automations/${automation.id}/edit`}
                      className="cursor-pointer"
                    >
                      <Edit className="size-4" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                        }}
                        disabled={isDeleting}
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="size-4 text-destructive" />
                        {isDeleting ? "Deleting..." : "Delete"}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete automation?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this automation? This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">Details</Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-4 space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Trigger Word
                </p>
                <div className="bg-muted/30 border border-border rounded-md px-2 inline-block text-xs py-0.5">
                  &quot;{automation.triggerWord}&quot;
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Response Type
                </p>
                <Badge
                  variant="outline"
                  className="bg-background border-border text-foreground font-medium"
                >
                  {automation.responseType === "fixed"
                    ? "Fixed Message"
                    : automation.responseType === "ai_prompt"
                    ? "AI Prompt"
                    : "Generic Template"}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status Control
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {automation.isActive ? "Enabled" : "Disabled"}
                  </span>
                  <Switch
                    checked={automation.isActive || false}
                    onCheckedChange={handleToggle}
                    disabled={isToggling}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Trigger Scope
                </p>
                <Badge
                  variant="outline"
                  className="bg-background border-border text-foreground font-medium"
                >
                  {triggerScope}
                </Badge>
              </div>

              {triggerScope !== "dm" && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Comment Replies
                  </p>
                  <div className="bg-muted/30 border border-border rounded-md px-2 inline-block text-xs py-0.5">
                    {(automation as Automation).commentReplyCount ?? 0}
                  </div>
                </div>
              )}
            </div>

            {automation.expiresAt && (
              <div className="pt-6 border-t border-border/50 flex flex-row justify-between items-center gap-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Expires
                </p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(automation.expiresAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}