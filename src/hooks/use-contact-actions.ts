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

async function performStageChange(
  contactId: string,
  stage: StageType,
  setIsPending: (v: boolean) => void
) {
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
}

async function performSentimentChange(
  contactId: string,
  sentiment: SentimentType,
  setIsPending: (v: boolean) => void
) {
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
}

async function performNotesChange(
  contactId: string,
  notes: string,
  setIsPending: (v: boolean) => void
) {
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
}

async function performHRNStateChange(
  contactId: string,
  requiresHumanResponse: boolean,
  setIsPending: (v: boolean) => void
) {
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
}

export function useContactActions() {
  const [isPending, setIsPending] = useState(false);

  const handleStageChange = (contactId: string, stage: StageType) =>
    performStageChange(contactId, stage, setIsPending);

  const handleSentimentChange = (contactId: string, sentiment: SentimentType) =>
    performSentimentChange(contactId, sentiment, setIsPending);

  const handleNotesChange = (contactId: string, notes: string) =>
    performNotesChange(contactId, notes, setIsPending);

  const handleHRNStateChange = (
    contactId: string,
    requiresHumanResponse: boolean
  ) => performHRNStateChange(contactId, requiresHumanResponse, setIsPending);

  return {
    isPending,
    handleStageChange,
    handleSentimentChange,
    handleNotesChange,
    handleHRNStateChange,
  };
}
