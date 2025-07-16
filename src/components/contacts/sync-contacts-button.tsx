"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { syncInstagramContacts } from "@/actions/contacts";

export default function SyncContactsButton() {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncContacts = async () => {
    setIsSyncing(true);
    
    try {
      const result = await syncInstagramContacts();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to trigger sync job");
      }
      
      toast.success("Contact sync started. This may take a moment.");
    } catch (error) {
      console.error("Error syncing contacts:", error);
      toast.error("Failed to sync contacts. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Button 
      onClick={handleSyncContacts} 
      disabled={isSyncing}
      className="flex gap-2 items-center"
    >
      <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Contacts"}
    </Button>
  );
}