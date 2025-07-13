"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InstagramConnection {
  connected: boolean;
  username?: string;
  error?: string;
}

interface IntegrationsProps {
  instagramConnection: InstagramConnection;
  handleInstagramConnect: () => void;
  handleInstagramDisconnect: () => Promise<void>;
  isConnecting: boolean;
  isDisconnecting: boolean;
}

export default function Integrations({
  instagramConnection,
  handleInstagramConnect,
  handleInstagramDisconnect,
  isConnecting,
  isDisconnecting,
}: IntegrationsProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 gap-4 flex-grow">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Instagram</CardTitle>
            <CardDescription>
              Connect your Instagram account to manage DMs directly from Pilot
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            {instagramConnection.connected ? (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="text-sm">
                  Connected as{" "}
                  <span className="font-semibold">
                    {instagramConnection.username}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Access your Instagram messages and respond to them using
                Pilot&apos;s AI suggestions
              </p>
            )}
          </CardContent>
          <CardFooter className="pt-2 mt-auto">
            {instagramConnection.connected ? (
              <Button
                variant="destructive"
                onClick={handleInstagramDisconnect}
                disabled={isDisconnecting}
                className="w-full"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            ) : (
              <Button
                onClick={handleInstagramConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}