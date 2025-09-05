import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SidekickChatbot } from "./sidekick-chatbot";

export function SidekickSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      side="right"
      variant="floating"
      collapsible="none"
      className="p-2 m-2 ml-0 bg-muted h-[calc(100vh-1rem)] rounded-xl shadow-lg w-(--sidebar-right-width)"
      {...props}
    >
      <SidebarHeader>
        <h2 className="text-base font-semibold">Sidekick</h2>
      </SidebarHeader>
      <SidebarContent className="p-0">
        <SidekickChatbot />
      </SidebarContent>
    </Sidebar>
  );
}