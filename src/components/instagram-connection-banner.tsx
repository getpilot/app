"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type InstagramStatus = {
  connected: boolean;
  username?: string;
};

async function loadInstagramStatus(
  setStatus: (s: InstagramStatus) => void,
  signal: AbortSignal
) {
  try {
    const res = await fetch("/api/auth/instagram/status", {
      cache: "no-cache",
      signal,
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    if (!signal.aborted) {
      setStatus({ connected: !!data.connected, username: data.username });
    }
  } catch {
    if (!signal.aborted) {
      setStatus({ connected: false });
    }
  }
}

export default function InstagramConnectionBanner() {
  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const controller = new AbortController();
    loadInstagramStatus(setStatus, controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  if (!status) return null;

  const isOnSettings = pathname === "/settings";

  if (status.connected) {
    return null;
  }

  return (
    <Alert
      className={cn(
        "border-0 border-b rounded-none flex flex-col items-center justify-center"
      )}
      variant="destructive"
    >
      <AlertTitle className="text-lg font-semibold">
        Instagram not connected
      </AlertTitle>
      <AlertDescription className="text-sm">
        Connect your account in settings to unlock all features.
      </AlertDescription>
      {!isOnSettings && (
        <Link
          href="/settings"
          className="text-white mt-2 inline-flex items-center justify-center rounded-md bg-destructive px-4 py-1.5 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Go to Settings <ArrowRight className="size-4 ml-2" />
        </Link>
      )}
    </Alert>
  );
}