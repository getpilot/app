import {
  BrainCircuit,
  BarChart,
  ArrowUpCircle,
  Settings,
  LucideIcon,
  Funnel,
  CreditCard,
  UserRound,
  Zap,
} from "lucide-react";

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
          title: "Contacts",
          url: "/contacts",
          icon: UserRound,
        },
        {
          title: "Automations",
          url: "/automations",
          icon: Zap,
        },
        {
          title: "Pipeline",
          url: "/pipeline",
          icon: Funnel,
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
          title: "Billing",
          url: "/billing",
          icon: CreditCard,
        },
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