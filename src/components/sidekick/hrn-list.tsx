"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircleIcon, CheckIcon } from "lucide-react";
import { fetchHRNContacts, updateContactHRNState } from "@/actions/contacts";
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
  humanResponseSetAt?: string;
  lastAutoClassification?: "auto_ok" | "hrn";
};

export function HRNList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    void fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const hrnContacts = await fetchHRNContacts();
      setContacts(hrnContacts);
    } catch (error) {
      console.error("Failed to fetch HRN contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (contactId: string) => {
    try {
      setUpdating(contactId);
      const res = await updateContactHRNState(contactId, {
        requiresHumanResponse: false,
      });
      if (!res.success) {
        toast.error(res.error || "Failed to clear HRN");
        return;
      }
      toast.success("HRN cleared. Bot re-enabled.");
      await fetchContacts();
    } catch (error) {
      console.error("Failed to update HRN state:", error);
      toast.error("Something went wrong. Try again?");
    } finally {
      setUpdating(null);
    }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return "Unknown";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>HRN Needed</CardTitle>
          <CardDescription>Collecting threads that are paused for human reply.</CardDescription>
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
        <CardTitle>HRN Needed ({contacts.length})</CardTitle>
        <CardDescription>
          Conversations the bot paused—respond quickly to keep momentum.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <h4 className="font-medium">Nothing in HRN right now.</h4>
            <p className="text-sm text-muted-foreground">
              Sidekick will route risky threads here for human review.
            </p>
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
                          <Badge variant="outline">
                            {contact.stage || "new"}
                          </Badge>
                          {contact.sentiment && (
                            <Badge variant="secondary">{contact.sentiment}</Badge>
                          )}
                        </div>
                        <span className="text-xs whitespace-nowrap text-muted-foreground">
                          HRN set: {formatTime(contact.humanResponseSetAt)}
                        </span>
                      </div>

                      {contact.lastMessage && (
                        <p className="text-sm line-clamp-2 text-pretty">
                          {contact.lastMessage}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        {contact.leadScore ? (
                          <span className="text-xs">Score: {contact.leadScore}</span>
                        ) : (
                          <span />
                        )}
                        <Button
                          size="sm"
                          className="min-w-[9rem]"
                          variant="default"
                          onClick={() => handleResolve(contact.id)}
                          disabled={updating === contact.id}
                        >
                          <CheckIcon className="size-4" aria-hidden="true" />
                          {updating === contact.id ? "Updating..." : "Mark handled"}
                        </Button>
                      </div>
                      {contact.lastAutoClassification && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <AlertCircleIcon size={14} />
                          <span>Last classification: {contact.lastAutoClassification}</span>
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