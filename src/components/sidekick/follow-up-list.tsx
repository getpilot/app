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
import { Sparkles } from "lucide-react";
import {
  fetchFollowUpContacts,
  generateFollowUpMessage,
} from "@/actions/contacts";

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

export function FollowUpList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingMessage, setGeneratingMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const followUpContacts = await fetchFollowUpContacts();
      setContacts(followUpContacts);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMessage = async (contactId: string) => {
    try {
      setGeneratingMessage(contactId);

      const result = await generateFollowUpMessage(contactId);

      if (result.success && result.message) {
        await fetchContacts();
      } else {
        console.error("Failed to generate message:", result.error);
        alert(`Failed to generate message: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to generate message:", error);
      alert("An unexpected error occurred while generating the message.");
    } finally {
      setGeneratingMessage(null);
    }
  };

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

  const getStageColor = (stage?: string) => {
    switch (stage) {
      case "lead":
        return "bg-green-100 text-green-800";
      case "follow-up":
        return "bg-blue-100 text-blue-800";
      case "ghosted":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Follow-up Needed</CardTitle>
          <CardDescription>
            Contacts that haven't replied in over 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-lg border p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
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
          Contacts that haven't replied in over 24 hours.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <h4 className="font-medium">You're all caught up</h4>
            <p className="text-sm">No contacts need follow-up right now.</p>
          </div>
        ) : (
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
                      {contact.leadScore ? (
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
                        <Sparkles className="mr-2 size-4" aria-hidden="true" />
                        {generatingMessage === contact.id
                          ? "Generating..."
                          : "Generate Message"}
                      </Button>
                    </div>

                    {/* Show generated message if available */}
                    {contact.followupMessage && (
                      <div className="mt-3 p-3 rounded-lg border">
                        <p className="text-sm font-medium mb-2">
                          Generated Follow-up Message:
                        </p>
                        <p className="text-sm">{contact.followupMessage}</p>
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                contact.followupMessage!
                              )
                            }
                          >
                            Copy to Clipboard
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleGenerateMessage(contact.id)}
                            disabled={generatingMessage === contact.id}
                          >
                            {generatingMessage === contact.id
                              ? "Regenerating..."
                              : "Regenerate"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}