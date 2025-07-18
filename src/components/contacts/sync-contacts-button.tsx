"use client";

import { Button } from "@/components/ui/button";
import { syncInstagramContacts } from "@/actions/contacts";
import { useState } from "react";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

export default function SyncContactsButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    try {
      setIsLoading(true);
      toast.info("Starting contact sync...");
      
      const result = await syncInstagramContacts();
      
      if (result.success) {
        toast.success("Contacts synchronized successfully! The AI analysis may take a few moments to complete.");
      } else {
        toast.error(`Failed to sync contacts: ${result.error}`);
      }
    } catch (error) {
      toast.error("An error occurred while syncing contacts");
      console.error("Error syncing contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      Sync Contacts
    </Button>
  );
}