"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidekickSidebar } from "./sidebar";
import { useSidekick } from "./sidekick-context";

export function SidekickToggle() {
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidekick();

  return (
    <>
      {!isSidebarOpen && (
        <Button
          onClick={openSidebar}
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          aria-label="Open Sidekick"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {isSidebarOpen && <SidekickSidebar onClose={closeSidebar} />}
    </>
  );
}