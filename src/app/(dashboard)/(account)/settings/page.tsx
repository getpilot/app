"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import SettingsForm from "@/components/settings/profile";
import { getUserSettings } from "@/actions/settings";
import Integrations from "@/components/settings/integrations";

type InstagramConnection = {
  connected: boolean;
  username?: string;
  error?: string;
};

type UserData = {
  id: string;
  name: string;
  email: string;
  gender: string | null;
  image?: string | null;
} | null;

export default function SettingsPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [instagramConnection, setInstagramConnection] =
    useState<InstagramConnection>({
      connected: false,
    });
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<UserData>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const data = await getUserSettings();
        console.log("User data loaded:", data); // Debug log
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    const checkInstagramConnection = async () => {
      try {
        const response = await axios.get("/api/auth/instagram/status");
        setInstagramConnection({
          connected: response.data.connected,
          username: response.data.username,
        });
      } catch (error) {
        console.error("Error checking Instagram connection:", error);
        toast.error("Error checking Instagram connection");
      }
    };

    checkInstagramConnection();
  }, []);

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (error) {
      toast.error(`Instagram connection failed: ${error}`);
    }

    if (success === "instagram_connected") {
      toast.success("Successfully connected to Instagram!");
      router.push("/settings");
    } else if (success === "instagram_disconnected") {
      toast.success("Successfully disconnected from Instagram");
      router.push("/settings");
    }
  }, [searchParams, router]);

  const handleInstagramConnect = () => {
    setIsConnecting(true);
    try {
      window.location.href = `/api/auth/instagram`;
    } catch (error) {
      console.error("Error connecting to Instagram:", error);
      setIsConnecting(false);
      toast.error("Error connecting to Instagram");
    }
  };

  const handleInstagramDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await axios.get("/api/auth/instagram/disconnect");
      toast.success("Disconnected from Instagram");
      setInstagramConnection({ connected: false });
      window.location.href = "/settings";
    } catch (error) {
      console.error("Error disconnecting from Instagram:", error);
      toast.error("Error disconnecting from Instagram");
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Manage your profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="my-auto h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SettingsForm userData={userData} />
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Connect third-party services with your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Integrations 
              instagramConnection={instagramConnection} 
              handleInstagramConnect={handleInstagramConnect} 
              handleInstagramDisconnect={handleInstagramDisconnect} 
              isConnecting={isConnecting} 
              isDisconnecting={isDisconnecting} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}