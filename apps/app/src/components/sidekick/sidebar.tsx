"use client";

import { Button } from "@/components/ui/button";
import { X, Plus, Clock } from "lucide-react";
import { SidekickChatbot } from "./chatbot";
import { ChatHistory } from "./chat-history";
import { useState, useRef } from "react";
import { UIMessage } from "ai";
import axios from "axios";
import { useSidekick } from "./context";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SidekickSidebarProps {
  onClose?: () => void;
}

async function loadSessionAction(
  sessionId: string,
  pendingSessionIdRef: { current: string | null },
  setCurrentMessages: (v: UIMessage[]) => void,
  setCurrentSessionId: (v: string | undefined) => void,
  setShowHistory: (v: boolean) => void
) {
  pendingSessionIdRef.current = sessionId;
  try {
    const { data } = await axios.get<{ messages: UIMessage[] }>(
      `/api/chat/sessions/${sessionId}`
    );
    if (pendingSessionIdRef.current !== sessionId) return;
    setCurrentMessages(Array.isArray(data.messages) ? data.messages : []);
    setCurrentSessionId(sessionId);
    setShowHistory(false);
  } catch (error) {
    console.error("Failed to load session:", error);
  } finally {
    pendingSessionIdRef.current = null;
  }
}

/**
 * Shared inner content: header + chat/history panel.
 * Rendered identically by both desktop and mobile variants.
 */
function SidekickSidebarContent({ onClose }: { onClose?: () => void }) {
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<
    string | undefined
  >();
  const [currentMessages, setCurrentMessages] = useState<UIMessage[]>([]);
  const [chatKey, setChatKey] = useState(0);
  const pendingSessionIdRef = useRef<string | null>(null);

  const handleNewChat = () => {
    setCurrentSessionId(undefined);
    setCurrentMessages([]);
    setShowHistory(false);
    setChatKey((prev) => prev + 1);
  };

  const handleSessionSelect = (sessionId: string) =>
    loadSessionAction(
      sessionId,
      pendingSessionIdRef,
      setCurrentMessages,
      setCurrentSessionId,
      setShowHistory
    );

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <>
      {/* Header */}
      <div className="flex h-(--header-height) shrink-0 items-center gap-2 border-b ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <h2 className="text-base font-medium">Chat</h2>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleHistory}
              className="size-8"
              aria-label="Chat History"
            >
              <Clock className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="size-8"
              aria-label="New Chat"
            >
              <Plus className="size-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="size-8"
                aria-label="Close Sidekick"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-auto p-0">
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
      </div>
    </>
  );
}

export function SidekickSidebar({ onClose }: SidekickSidebarProps) {
  const { state, isMobile, openMobile, setOpenMobile } = useSidekick();

  const collapsible = state === "collapsed" ? "offcanvas" : "";

  // ── Mobile: Radix Sheet ──────────────────────────────────────────
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="right"
          className="bg-background text-foreground w-[18rem] p-0 [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidekick</SheetTitle>
            <SheetDescription>Chat with Sidekick.</SheetDescription>
          </SheetHeader>
          <div className="flex size-full flex-col">
            <SidekickSidebarContent onClose={onClose} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // ── Desktop: Offcanvas slide ─────────────────────────────────────
  return (
    <div
      className="group peer text-foreground hidden md:block"
      data-state={state}
      data-collapsible={collapsible}
      data-side="right"
    >
      {/* Div A — Gap Spacer: pushes main content to the left */}
      <div
        className={
          "relative w-(--sidebar-right-width) bg-transparent transition-[width] duration-200 ease-linear " +
          "group-data-[collapsible=offcanvas]:w-0"
        }
      />

      {/* Div B — Fixed Sidebar Panel: slides in/out from the right edge */}
      <div
        className={
          "fixed inset-y-0 right-0 z-10 hidden h-svh w-(--sidebar-right-width) " +
          "transition-[left,right,width] duration-200 ease-linear md:flex " +
          "group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-right-width)*-1)] " +
          "p-2"
        }
      >
        <div className="flex size-full flex-col overflow-hidden rounded-xl border bg-background shadow-lg">
          <SidekickSidebarContent onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
