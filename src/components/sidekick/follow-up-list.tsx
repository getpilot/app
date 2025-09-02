"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchInstagramContacts } from "@/actions/contacts";

type Contact = {
  id: string;
  name: string;
  lastMessage?: string;
  timestamp?: string;
  stage?: string;
  sentiment?: string;
  leadScore?: number;
};

export function FollowUpList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const allContacts = await fetchInstagramContacts();

      // Filter for contacts needing follow-up:
      // - last message > 24h ago
      // - stage not "closed" or "ghosted"
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const followUpContacts = allContacts.filter((contact) => {
        if (!contact.timestamp) return false;
        if (contact.stage === "closed" || contact.stage === "ghosted")
          return false;

        const lastMessageTime = new Date(contact.timestamp);
        return lastMessageTime < twentyFourHoursAgo;
      });

      setContacts(followUpContacts);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
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
      <Card>
        <CardHeader>
          <CardTitle>Follow-up Needed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading contacts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up Needed ({contacts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-muted-foreground">No contacts need follow-up</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{contact.name}</h4>
                  <Badge className={getStageColor(contact.stage)}>
                    {contact.stage || "new"}
                  </Badge>
                </div>
                {contact.lastMessage && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {contact.lastMessage}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {contact.timestamp && formatTimeAgo(contact.timestamp)}
                  </span>
                  {contact.leadScore && (
                    <span className="text-xs text-muted-foreground">
                      Score: {contact.leadScore}
                    </span>
                  )}
                </div>
                <Button size="sm" className="w-full">
                  Send Follow-up
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}