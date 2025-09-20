"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { SidekickChatbot } from "./chatbot";
import { useState } from "react";
import { UIMessage } from "ai";
import axios from "axios";

interface SidekickSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onClose?: () => void;
}

export function SidekickSidebar({ onClose, ...props }: SidekickSidebarProps) {
  const [currentSessionId, setCurrentSessionId] = useState<
    string | undefined
  >();
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);

  const handleNewChat = async () => {
    try {
      const response = await axios.post("/api/chat/sessions", {
        title: "New Chat",
      });

      const { id } = response.data;
      console.log("Created new chat session:", id);
      setCurrentSessionId(id);
      setInitialMessages([]);
    } catch (error) {
      console.error("Failed to create new chat:", error);
    }
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
        {currentSessionId ? (
          <SidekickChatbot
            sessionId={currentSessionId}
            initialMessages={initialMessages}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">
              Click the + button to start a new chat
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}