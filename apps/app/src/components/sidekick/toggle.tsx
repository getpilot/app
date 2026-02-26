"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@pilot/ui/components/button";
import { SidekickSidebar } from "./sidebar";
import { useSidekick } from "./context";

export function SidekickToggle() {
  const { open, openMobile, toggleSidebar, closeSidebar, isMobile } = useSidekick();

  // FAB is hidden when sidebar is open (instant removal, no transition)
  const showFab = isMobile ? !openMobile : !open;

  return (
    <>
      {showFab && (
        <Button
          onClick={toggleSidebar}
          size="icon"
          className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          aria-label="Open Sidekick"
        >
          <Sparkles className="size-6" />
        </Button>
      )}

      {/* Always rendered so the offcanvas slide animation can play */}
      <SidekickSidebar onClose={closeSidebar} />
    </>
  );
}