"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { sidebarData } from "@/lib/constants/sidebar";
import ThemeToggler from "@/components/theme/toggler";

export default function SiteHeader() {
  const pathname = usePathname();

  const getCurrentPageTitle = () => {
    let currentTitle = "Dashboard";

    for (const section of sidebarData.navMain) {
      for (const item of section.items) {
        if (item.url === pathname) {
          return item.title;
        }
        
        if (pathname !== "/" && pathname.startsWith(item.url) && item.url !== "/") {
          currentTitle = item.title;
        }
      }
    }

    return currentTitle;
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center md:hidden">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
        </div>
        <h1 className="text-base font-medium">{getCurrentPageTitle()}</h1>
        <ThemeToggler className="ml-auto" />
      </div>
    </header>
  );
}