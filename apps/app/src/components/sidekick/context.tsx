"use client";

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidekickContextType {
  state: "expanded" | "collapsed";
  open: boolean;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidekickContext = createContext<SidekickContextType | undefined>(undefined);

export function SidekickProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setOpen((prev) => !prev);
    }
  }, [isMobile]);

  const openSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile(true);
    } else {
      setOpen(true);
    }
  }, [isMobile]);

  const closeSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  }, [isMobile]);

  const state = open ? "expanded" : "collapsed";

  const value = useMemo<SidekickContextType>(
    () => ({
      state,
      open,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      openSidebar,
      closeSidebar,
    }),
    [state, open, isMobile, openMobile, toggleSidebar, openSidebar, closeSidebar]
  );

  return (
    <SidekickContext.Provider value={value}>
      {children}
    </SidekickContext.Provider>
  );
}

export function useSidekick() {
  const context = useContext(SidekickContext);
  if (context === undefined) {
    throw new Error("useSidekick must be used within a SidekickProvider");
  }
  return context;
}