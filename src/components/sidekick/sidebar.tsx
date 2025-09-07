"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { X, Plus, Clock } from "lucide-react";
import { SidekickChatbot } from "./chatbot";
import { ChatHistory } from "./chat-history";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

interface SidekickSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onClose?: () => void;
}

export function SidekickSidebar({ onClose, ...props }: SidekickSidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentSessionId, setCurrentSessionId] = useState<
    string | undefined
  >();
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const isCreatingSession = useRef(false);

  useEffect(() => {
    const sessionId = searchParams.get("sessionId");
    const chatOpen = searchParams.get("chatOpen") === "true";

    if (sessionId && sessionId !== currentSessionId) {
      handleSelectChat(sessionId);
    }

    setShowHistory(!chatOpen);
  }, [searchParams]);

  useEffect(() => {
    const createInitialSession = async () => {
      if (
        !currentSessionId &&
        !isCreatingSession.current &&
        !searchParams.get("sessionId")
      ) {
        isCreatingSession.current = true;
        try {
          const response = await axios.post("/api/chat/sessions", {
            title: "New Chat",
          });

          const { id } = response.data;
          console.log("Created initial session:", id);
          setCurrentSessionId(id);
          setInitialMessages([]);

          const params = new URLSearchParams(searchParams);
          params.set("sessionId", id);
          params.set("chatOpen", "true");
          router.replace(`?${params.toString()}`);
        } catch (error) {
          console.error("Failed to create initial chat:", error);
        } finally {
          isCreatingSession.current = false;
        }
      }
    };

    createInitialSession();
  }, [searchParams, router]);

  const handleNewChat = async () => {
    try {
      const response = await axios.post("/api/chat/sessions", {
        title: "New Chat",
      });

      const { id } = response.data;
      console.log("Created new chat session:", id);
      setCurrentSessionId(id);
      setInitialMessages([]);
      setShowHistory(false);

      const params = new URLSearchParams(searchParams);
      params.set("sessionId", id);
      params.set("chatOpen", "true");
      router.replace(`?${params.toString()}`);
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
  };

  const handleSelectChat = async (sessionId: string) => {
    try {
      const response = await axios.get(`/api/chat/sessions/${sessionId}`);
      const messages = response.data;
      setCurrentSessionId(sessionId);
      setInitialMessages(messages);
      setShowHistory(false);

      const params = new URLSearchParams(searchParams);
      params.set("sessionId", sessionId);
      params.set("chatOpen", "true");
      router.replace(`?${params.toString()}`);
    } catch (error) {
      console.error("Failed to load chat session:", error);
    }
  };

  const toggleHistory = () => {
    const newShowHistory = !showHistory;
    setShowHistory(newShowHistory);

    const params = new URLSearchParams(searchParams);
    if (newShowHistory) {
      params.delete("chatOpen");
    } else {
      params.set("chatOpen", "true");
    }
    router.replace(`?${params.toString()}`);
  };

  return (
    <Sidebar
      side="right"
      variant="floating"
      collapsible="none"
      className="overflow-hidden m-2 ml-0 bg-muted h-[calc(100vh-1rem)] rounded-xl shadow-lg w-(--sidebar-right-width) sticky top-2"
      {...props}
    >
      <SidebarHeader className="flex h-(--header-height) shrink-0 items-center gap-2 border-b ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <h2 className="text-base font-medium">Chat</h2>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="h-8 w-8"
              aria-label="New Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleHistory}
              className="h-8 w-8"
              aria-label="View History"
            >
              <Clock className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete("chatOpen");
                  router.replace(`?${params.toString()}`);
                  onClose();
                }}
                className="h-8 w-8"
                aria-label="Close Sidekick"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        {showHistory ? (
          <ChatHistory
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            currentSessionId={currentSessionId}
          />
        ) : currentSessionId ? (
          <SidekickChatbot
            sessionId={currentSessionId}
            initialMessages={initialMessages}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">
              Creating chat session...
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}