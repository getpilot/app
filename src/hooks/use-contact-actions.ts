import { useState } from "react";
import {
  updateContactStage,
  updateContactSentiment,
  updateContactNotes,
  updateContactHRNState,
} from "@/actions/contacts";
import { toast } from "sonner";

type StageType = "new" | "lead" | "follow-up" | "ghosted";
type SentimentType = "hot" | "warm" | "cold" | "ghosted" | "neutral";

export function useContactActions() {
  const [isPending, setIsPending] = useState(false);

  const handleStageChange = async (contactId: string, stage: StageType) => {
    try {
      setIsPending(true);
      const result = await updateContactStage(contactId, stage);

      if (result.success) {
        toast.success(`Contact stage updated to ${stage}`);
      } else {
        toast.error(result.error || "Failed to update stage");
      }

      return result.success;
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const handleSentimentChange = async (
    contactId: string,
    sentiment: SentimentType
  ) => {
    try {
      setIsPending(true);
      const result = await updateContactSentiment(contactId, sentiment);

      if (result.success) {
        toast.success(`Contact sentiment updated to ${sentiment}`);
      } else {
        toast.error(result.error || "Failed to update sentiment");
      }

      return result.success;
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const handleNotesChange = async (contactId: string, notes: string) => {
    try {
      setIsPending(true);
      const result = await updateContactNotes(contactId, notes);

      if (result.success) {
        toast.success("Notes saved successfully");
      } else {
        toast.error(result.error || "Failed to save notes");
      }

      return result.success;
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const handleHRNStateChange = async (
    contactId: string,
    requiresHumanResponse: boolean
  ) => {
    try {
      setIsPending(true);
      const result = await updateContactHRNState(contactId, {
        requiresHumanResponse,
      });

      if (result.success) {
        toast.success(
          requiresHumanResponse
            ? "Marked as Human Response Needed"
            : "Returned to auto-reply"
        );
      } else {
        toast.error(result.error || "Failed to update HRN state");
      }

      return result.success;
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return {
    isPending,
    handleStageChange,
    handleSentimentChange,
    handleNotesChange,
    handleHRNStateChange,
  };
}