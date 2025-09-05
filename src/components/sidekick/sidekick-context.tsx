"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SidekickContextType {
  isSidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const SidekickContext = createContext<SidekickContextType | undefined>(undefined);

export function SidekickProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <SidekickContext.Provider value={{ isSidebarOpen, openSidebar, closeSidebar }}>
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