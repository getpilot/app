"use client";

import { Button } from "@pilot/ui/components/button";
import { Checkbox } from "@pilot/ui/components/checkbox";
import { Label } from "@pilot/ui/components/label";
import {
  syncInstagramContacts,
  getContactsLastUpdatedAt,
  hasContactsUpdatedSince,
} from "@/actions/contacts";
import { getSyncSubscribeToken } from "@/actions/realtime";
import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { LoaderCircle, RefreshCw } from "lucide-react";

const SYNC_STATUS_POLL_INTERVAL_MS = 1_200;
const MAX_SYNC_STATUS_WAIT_MS = 10_000;
const MANUAL_SYNC_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const MANUAL_SYNC_STORAGE_KEY = "pilot:last-manual-contact-sync-at";

function getStoredNextAllowedAt() {
  if (typeof window === "undefined") {
    return null;
  }

  const lastManualSyncAt = window.localStorage.getItem(MANUAL_SYNC_STORAGE_KEY);
  if (!lastManualSyncAt) {
    return null;
  }

  const nextAllowedAt = new Date(
    new Date(lastManualSyncAt).getTime() + MANUAL_SYNC_COOLDOWN_MS,
  );

  if (
    Number.isNaN(nextAllowedAt.getTime()) ||
    nextAllowedAt.getTime() <= Date.now()
  ) {
    window.localStorage.removeItem(MANUAL_SYNC_STORAGE_KEY);
    return null;
  }

  return nextAllowedAt.toISOString();
}

async function performSync(
  fullSync: boolean,
  realtimeStatusRef: React.RefObject<string | undefined>,
  setIsLoading: (v: boolean) => void,
  setRealtimeStatus: (v: string | undefined) => void,
  setNextAllowedAt: (v: string | null) => void,
) {
  try {
    setIsLoading(true);
    setRealtimeStatus(undefined);
    toast.info("Starting contact sync and AI scoring...");
    const before = await getContactsLastUpdatedAt();

    const result = await syncInstagramContacts(fullSync);

    if (result.success) {
      const nextAllowedAt = new Date(
        Date.now() + MANUAL_SYNC_COOLDOWN_MS,
      ).toISOString();
      setNextAllowedAt(nextAllowedAt);
      window.localStorage.setItem(
        MANUAL_SYNC_STORAGE_KEY,
        new Date().toISOString(),
      );

      const start = Date.now();
      let updated = false;
      while (Date.now() - start < MAX_SYNC_STATUS_WAIT_MS) {
        if (before) {
          const { updated: hasUpdated } = await hasContactsUpdatedSince(before);
          if (hasUpdated) {
            updated = true;
            break;
          }
        } else {
          await new Promise((r) => setTimeout(r, SYNC_STATUS_POLL_INTERVAL_MS));
          updated = true;
          break;
        }
        await new Promise((r) => setTimeout(r, SYNC_STATUS_POLL_INTERVAL_MS));
      }
      const statusMsg = realtimeStatusRef.current;
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
        : result.error || "Failed to sync contacts. Please try again later.";
      toast.error(errorMessage);

      console.error("Sync failed:", result.error);
    }
  } catch (error) {
    toast.error("An error occurred while syncing contacts");
    console.error("Error syncing contacts:", error);
  } finally {
    setIsLoading(false);
  }
}

export default function SyncContactsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [fullSync, setFullSync] = useState(false);
  const [nextAllowedAt, setNextAllowedAt] = useState<string | null>(
    getStoredNextAllowedAt,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [realtimeStatus, setRealtimeStatus] = useState<string | undefined>(
    undefined,
  );
  const realtimeStatusRef = useRef<string | undefined>(undefined);
  const hasShownCooldownToastRef = useRef(false);
  const remainingMs = nextAllowedAt
    ? new Date(nextAllowedAt).getTime() - nowMs
    : 0;
  const syncDisabled = remainingMs > 0;
  const rateLimitMessage = syncDisabled
    ? `Manual sync is available again in ${formatRemainingDuration(remainingMs)}.`
    : null;

  useEffect(() => {
    realtimeStatusRef.current = realtimeStatus;
  }, [realtimeStatus]);

  useEffect(() => {
    if (syncDisabled && !hasShownCooldownToastRef.current) {
      hasShownCooldownToastRef.current = true;
      toast.info(
        `Manual sync is cooling down. Available again in ${formatRemainingDuration(
          remainingMs,
        )}.`,
      );
    }

    if (!syncDisabled) {
      hasShownCooldownToastRef.current = false;
    }
  }, [remainingMs, syncDisabled]);

  useEffect(() => {
    if (!syncDisabled) {
      return;
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [syncDisabled]);

  useEffect(() => {
    if (!nextAllowedAt || syncDisabled) {
      return;
    }

    window.localStorage.removeItem(MANUAL_SYNC_STORAGE_KEY);
  }, [nextAllowedAt, syncDisabled]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== MANUAL_SYNC_STORAGE_KEY) {
        return;
      }

      hasShownCooldownToastRef.current = false;
      setNowMs(Date.now());
      setNextAllowedAt(getStoredNextAllowedAt());
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleSync = () => {
    if (syncDisabled) {
      toast.error(
        `Manual sync is rate-limited. Try again in ${formatRemainingDuration(
          remainingMs,
        )}.`,
      );
      return;
    }

    return performSync(
      fullSync,
      realtimeStatusRef,
      setIsLoading,
      setRealtimeStatus,
      (value) => {
        setNowMs(Date.now());
        setNextAllowedAt(value);
      },
    );
  };

  return (
    <div className="flex items-center gap-3">
      {isLoading && (
        <RealtimeSyncWatcher
          onCompleted={() => setRealtimeStatus("Sync complete.")}
        />
      )}
      {rateLimitMessage && (
        <p className="text-xs text-muted-foreground">{rateLimitMessage}</p>
      )}
      <div className="flex items-center gap-2">
        <Checkbox
          id="full-sync"
          checked={fullSync}
          onCheckedChange={(checked) => setFullSync(Boolean(checked))}
          className="border-border data-[state=checked]:bg-primary"
          disabled={isLoading || syncDisabled}
        />
        <Label htmlFor="full-sync" className="text-sm">
          Full sync
        </Label>
      </div>
      <Button
        onClick={handleSync}
        disabled={isLoading || syncDisabled}
        className="gap-2"
      >
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

function formatRemainingDuration(remainingMs: number) {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

function RealtimeSyncWatcher({ onCompleted }: { onCompleted: () => void }) {
  const { latestData } = useInngestSubscription({
    refreshToken: getSyncSubscribeToken,
  });
  const onCompletedEvent = useEffectEvent(onCompleted);

  useEffect(() => {
    if (latestData?.data?.status === "completed") {
      // Small delay or schedule for next turn to ensure it's not synchronous in effect body
      const timer = setTimeout(() => {
        onCompletedEvent();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [latestData, onCompletedEvent]);

  return null;
}
