"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardIcon, Sparkles } from "lucide-react";
import {
  fetchFollowUpContacts,
  generateFollowUpMessage,
} from "@/actions/contacts";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

type Contact = {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  stage?: string;
  sentiment?: string;
  leadScore?: number;
  followupMessage?: string;
};

async function fetchContactsAction(
  setContacts: (v: Contact[]) => void,
  setLoading: (v: boolean) => void
) {
  try {
    const followUpContacts = await fetchFollowUpContacts();
    setContacts(followUpContacts);
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
  } finally {
    setLoading(false);
  }
}

async function handleGenerateMessageAction(
  contactId: string,
  setGeneratingMessage: (v: string | null) => void,
  setContacts: (v: Contact[]) => void,
  setLoading: (v: boolean) => void
) {
  try {
    setGeneratingMessage(contactId);
    const result = await generateFollowUpMessage(contactId);
    if (result.success && result.message) {
      await fetchContactsAction(setContacts, setLoading);
    } else {
      console.error("Failed to generate message:", result.error);
      alert(`Couldn't generate message: ${result.error}`);
    }
  } catch (error) {
    console.error("Failed to generate message:", error);
    alert("Something went wrong. Try again?");
  } finally {
    setGeneratingMessage(null);
  }
}

export function FollowUpList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingMessage, setGeneratingMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchContactsAction(setContacts, setLoading);
  }, []);

  const handleGenerateMessage = (contactId: string) =>
    handleGenerateMessageAction(contactId, setGeneratingMessage, setContacts, setLoading);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return "Less than an hour ago";
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading Follow-ups...</CardTitle>
          <CardDescription>
            Finding contacts who need your attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-lg border p-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-28 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Follow-up Needed ({contacts.length})</CardTitle>
        <CardDescription>
          People who haven&apos;t replied in over 24 hours. Time to follow up!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <h4 className="font-medium">All caught up!</h4>
            <p className="text-sm">No one needs follow-up right now. You&apos;re crushing it!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-full h-[300px] pr-1">
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="rounded-lg border p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-10 border">
                      <AvatarFallback>
                        {contact.name?.slice(0, 2)?.toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">{contact.name}</h4>
                          <Badge>{contact.stage || "new"}</Badge>
                        </div>
                        <span className="text-xs whitespace-nowrap">
                          {contact.timestamp && formatTimeAgo(contact.timestamp)}
                        </span>
                      </div>

                      {contact.lastMessage && (
                        <p className="text-sm line-clamp-2 text-pretty">
                          {contact.lastMessage}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        {contact.leadScore !== null && contact.leadScore !== undefined ? (
                          <span className="text-xs">
                            Score: {contact.leadScore}
                          </span>
                        ) : (
                          <span />
                        )}
                        <Button
                          size="sm"
                          className="min-w-[9rem]"
                          onClick={() => handleGenerateMessage(contact.id)}
                          disabled={generatingMessage === contact.id}
                        >
                          <Sparkles className="size-4" aria-hidden="true" />
                          {generatingMessage === contact.id
                            ? "Creating..."
                            : "Write Follow-up"}
                        </Button>
                      </div>

                      {/* Show generated message if available */}
                      {contact.followupMessage && (
                        <div className="flex justify-between items-center gap-4 border p-3 rounded-md">
                          <p className="text-sm text-muted-foreground">
                            {contact.followupMessage}
                          </p>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                contact.followupMessage!
                              );
                              toast.success("Copied!");
                            }}
                          >
                            <ClipboardIcon className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
