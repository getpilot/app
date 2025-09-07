"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search, Trash2, Plus } from "lucide-react";
import { ChatSession } from "@/lib/chat-store";

interface ChatHistoryProps {
  onSelectChat: (sessionId: string) => void;
  onNewChat: () => void;
  currentSessionId?: string;
}

export function ChatHistory({
  onSelectChat,
  onNewChat,
  currentSessionId,
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/chat/sessions");
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSessions(sessions.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          onNewChat();
        }
      }
    } catch (error) {
      console.error("Failed to delete chat session:", error);
    }
  };

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupSessionsByDate = (sessions: ChatSession[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);

    const groups: { [key: string]: ChatSession[] } = {
      Today: [],
      Yesterday: [],
      "2d ago": [],
      "3d ago": [],
      Older: [],
    };

    sessions.forEach((session) => {
      const sessionDate = new Date(session.updatedAt);

      if (sessionDate >= today) {
        groups["Today"].push(session);
      } else if (sessionDate >= yesterday) {
        groups["Yesterday"].push(session);
      } else if (sessionDate >= twoDaysAgo) {
        groups["2d ago"].push(session);
      } else if (sessionDate >= threeDaysAgo) {
        groups["3d ago"].push(session);
      } else {
        groups["Older"].push(session);
      }
    });

    return groups;
  };

  const groupedSessions = groupSessionsByDate(filteredSessions);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading chat history...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-medium">Chat</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="ml-auto h-8 w-8"
            aria-label="New Chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(groupedSessions).map(([groupName, groupSessions]) => {
            if (groupSessions.length === 0) return null;

            return (
              <div key={groupName} className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-2">
                  {groupName}
                </h3>
                {groupSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 ${
                      currentSessionId === session.id ? "bg-muted" : ""
                    }`}
                    onClick={() => onSelectChat(session.id)}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm truncate">
                      {session.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            );
          })}

          {filteredSessions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {searchTerm ? "No chats found" : "No chat history yet"}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}