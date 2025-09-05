"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidekickSidebar } from "./sidebar";

export function SidekickToggle() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <Button
        onClick={toggleSidebar}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
        aria-label={isOpen ? "Close Sidekick" : "Open Sidekick"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </Button>

      {isOpen && <SidekickSidebar />}
    </>
  );
}