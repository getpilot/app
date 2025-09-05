import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { SidekickChatbot } from "./sidekick-chatbot";

interface SidekickSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onClose?: () => void;
}

export function SidekickSidebar({ onClose, ...props }: SidekickSidebarProps) {
  return (
    <Sidebar
      side="right"
      variant="floating"
      collapsible="none"
      className="m-2 ml-0 bg-muted h-[calc(100vh-1rem)] rounded-xl shadow-lg w-(--sidebar-right-width)"
      {...props}
    >
      <SidebarHeader className="flex h-(--header-height) shrink-0 items-center gap-2 border-b ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <h2 className="text-base font-medium">Sidekick</h2>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="ml-auto h-8 w-8"
              aria-label="Close Sidekick"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <SidekickChatbot />
      </SidebarContent>
    </Sidebar>
  );
}