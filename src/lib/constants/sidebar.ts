export type SidebarItem = {
  title: string;
  url: string;
  isActive?: boolean;
};

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

export const sidebarData = {
  navMain: [
    {
      title: "Workspace",
      items: [
        {
          title: "Sidekick",
          url: "/",
        },
        {
          title: "Pipeline",
          url: "/pipeline",
        },
        {
          title: "Followups",
          url: "/followups",
        },
        {
          title: "Analytics",
          url: "/analytics",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Upgrade",
          url: "/upgrade",
        },
        {
          title: "Settings",
          url: "/settings",
        },
      ],
    },
  ],
} as { navMain: SidebarSection[] };