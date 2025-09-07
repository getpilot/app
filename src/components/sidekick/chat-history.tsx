"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await axios.get("/api/chat/sessions");
      setSessions(response.data);
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!sessionToDelete) return;

    try {
      await axios.delete(`/api/chat/sessions/${sessionToDelete}`);
      setSessions(sessions.filter((s) => s.id !== sessionToDelete));
      if (currentSessionId === sessionToDelete) {
        onNewChat();
      }
    } catch (error) {
      console.error("Failed to delete chat session:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
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
          <h2 className="text-base font-medium">History</h2>
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
              <div key={groupName} className="mb-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide my-2 px-2">
                  {groupName}
                </h3>
                <div className="flex flex-col gap-2">
                  {groupSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`gap-2 border group flex items-center py-2 px-4 rounded-lg cursor-pointer hover:bg-muted/50 ${
                        currentSessionId === session.id
                          ? "bg-muted border-muted-foreground"
                          : ""
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(session.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat session? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}