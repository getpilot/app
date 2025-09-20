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
import { useState } from "react";
import { UIMessage } from "ai";
import axios from "axios";

interface SidekickSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onClose?: () => void;
}

export function SidekickSidebar({ onClose, ...props }: SidekickSidebarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<
    string | undefined
  >();
  const [currentMessages, setCurrentMessages] = useState<UIMessage[]>([]);
  const [chatKey, setChatKey] = useState(0);

  const handleNewChat = () => {
    setCurrentSessionId(undefined);
    setCurrentMessages([]);
    setShowHistory(false);
    setChatKey(prev => prev + 1);
  };

  const handleSessionSelect = async (sessionId: string) => {
    try {
      const response = await axios.get(`/api/chat/sessions/${sessionId}`);
      setCurrentMessages(response.data.messages);
      setCurrentSessionId(sessionId);
      setShowHistory(false);
    } catch (error) {
      console.error("Failed to load session:", error);
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
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
              onClick={toggleHistory}
              className="h-8 w-8"
              aria-label="Chat History"
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="h-8 w-8"
              aria-label="New Chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
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
            currentSessionId={currentSessionId}
            onSelectChat={handleSessionSelect}
            onNewChat={handleNewChat}
          />
        ) : (
          <SidekickChatbot
            key={chatKey}
            sessionId={currentSessionId}
            initialMessages={currentMessages}
            onSessionCreated={(sessionId) => {
              setCurrentSessionId(sessionId);
            }}
          />
        )}
      </SidebarContent>
    </Sidebar>
  );
}