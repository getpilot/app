import { BrainCircuit, Mail, BarChart, ArrowUpCircle, Settings, LucideIcon, Funnel } from "lucide-react";

export type SidebarItem = {
  title: string;
  url: string;
  isActive?: boolean;
  icon: LucideIcon;
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
          icon: BrainCircuit,
        },
        {
          title: "Pipeline",
          url: "/pipeline",
          icon: Funnel,
        },
        {
          title: "Followups",
          url: "/followups",
          icon: Mail,
        },
        {
          title: "Analytics",
          url: "/analytics",
          icon: BarChart,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          title: "Upgrade",
          url: "/upgrade",
          icon: ArrowUpCircle,
        },
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
        },
      ],
    },
  ],
} as { navMain: SidebarSection[] };