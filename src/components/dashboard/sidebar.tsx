"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { UserProfileDesktop } from "@/components/user-profile";
import { sidebarData, type SidebarItem } from "@/lib/constants/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plane } from "lucide-react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const isRouteActive = (url: string) => {
    if (url === "/" && pathname === "/") {
      return true;
    }
    return pathname !== "/" && pathname.startsWith(url);
  };
  
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-2 p-2">
              <h1 className="text-2xl font-bold">Pilot.AI</h1>
              <Plane width={32} height={32} strokeWidth={1.5} />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarData.navMain.map((section) => (
              <SidebarMenuItem key={section.title} className="my-4">
                <SidebarMenuButton asChild>
                  <h3 className="font-medium">
                    {section.title}
                  </h3>
                </SidebarMenuButton>
                {section.items?.length ? (
                  <SidebarMenuSub>
                    {section.items.map((item: SidebarItem) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={isRouteActive(item.url)}>
                          <Link href={item.url}>{item.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserProfileDesktop />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}