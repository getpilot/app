import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";

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
      <SidebarHeader className="border-sidebar-border h-16 border-b flex items-center justify-center">
        <h2 className="text-lg font-semibold">Sidekick</h2>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <div className="text-muted-foreground text-center">Coming soon…</div>
      </SidebarContent>
    </Sidebar>
  );
}