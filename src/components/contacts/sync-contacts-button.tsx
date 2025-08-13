"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { syncInstagramContacts } from "@/actions/contacts";
import { useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, RefreshCw } from "lucide-react";

export default function SyncContactsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [fullSync, setFullSync] = useState(process.env.NODE_ENV !== "production");

  const handleSync = async () => {
    try {
      setIsLoading(true);
      toast.info("Starting contact sync...");
      
      const result = await syncInstagramContacts(fullSync);
      
      if (result.success) {
        toast.success("Contacts synchronized successfully! The AI analysis may take a few moments to complete.");
      } else {
        toast.error("Failed to sync contacts. Please try again later.");
        console.error("Sync failed:", result.error);
      }
    } catch (error) {
      toast.error("An error occurred while syncing contacts");
      console.error("Error syncing contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id="full-sync"
          checked={fullSync}
          onCheckedChange={(checked) => setFullSync(Boolean(checked))}
          className="border-border data-[state=checked]:bg-primary"
          disabled={isLoading}
        />
        <Label htmlFor="full-sync" className="text-sm">Full sync</Label>
      </div>
      <Button
        onClick={handleSync}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Sync Contacts
      </Button>
    </div>
  );
}