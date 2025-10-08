"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  syncInstagramContacts,
  getContactsLastUpdatedAt,
  hasContactsUpdatedSince,
} from "@/actions/contacts";
import { getSyncSubscribeToken } from "@/actions/realtime";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, RefreshCw } from "lucide-react";

export default function SyncContactsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [fullSync, setFullSync] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<string | undefined>(
    undefined
  );

  const handleSync = async () => {
    try {
      setIsLoading(true);
      setRealtimeStatus(undefined);
      toast.info("Starting contact sync and AI scoring...");
      const before = await getContactsLastUpdatedAt();

      const result = await syncInstagramContacts(fullSync);

      if (result.success) {
        const start = Date.now();
        let updated = false;
        while (Date.now() - start < Infinity) {
          if (before) {
            const { updated: hasUpdated } = await hasContactsUpdatedSince(
              before
            );
            if (hasUpdated) {
              updated = true;
              break;
            }
          } else {
            await new Promise((r) => setTimeout(r, 1200));
            updated = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 1200));
        }
        const statusMsg = realtimeStatus;
        toast.success(
          statusMsg ||
            (updated
              ? "Sync complete. Contacts updated."
              : "Sync triggered. Updates will appear shortly.")
        );
        if (updated) {
          window.location.reload();
        }
      } else {
        const errorMessage = result.error?.includes("token expired")
          ? "Instagram token expired. Please reconnect your Instagram account in Settings."
          : "Failed to sync contacts. Please try again later.";

        toast.error(errorMessage);
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
      {isLoading && (
        <RealtimeSyncWatcher
          onCompleted={() => setRealtimeStatus("Sync complete.")}
        />
      )}
      <div className="flex items-center gap-2">
        <Checkbox
          id="full-sync"
          checked={fullSync}
          onCheckedChange={(checked) => setFullSync(Boolean(checked))}
          className="border-border data-[state=checked]:bg-primary"
          disabled={isLoading}
        />
        <Label htmlFor="full-sync" className="text-sm">
          Full sync
        </Label>
      </div>
      <Button onClick={handleSync} disabled={isLoading} className="gap-2">
        {isLoading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        Sync Contacts
      </Button>
    </div>
  );
}

function RealtimeSyncWatcher({ onCompleted }: { onCompleted: () => void }) {
  const { latestData } = useInngestSubscription({
    refreshToken: getSyncSubscribeToken,
  });

  useEffect(() => {
    if (latestData?.data?.status === "completed") {
      onCompleted();
    }
  }, [latestData, onCompleted]);

  return null;
}