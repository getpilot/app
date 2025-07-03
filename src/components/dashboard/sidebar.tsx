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
    <Sidebar {...props} variant="inset">
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
        <SidebarGroup className="my-auto">
          <SidebarMenu>
            {sidebarData.navMain.map((section) => (
              <SidebarMenuItem key={section.title} className="my-4 md:my-6">
                <SidebarMenuButton asChild className="text-muted-foreground text-base hover:bg-transparent hover:text-muted-foreground active:bg-transparent active:text-muted-foreground">
                  <h3 className="font-medium py-5 px-4">
                    {section.title}
                  </h3>
                </SidebarMenuButton>
                {section.items?.length ? (
                  <SidebarMenuSub>
                    {section.items.map((item: SidebarItem) => (
                      <SidebarMenuSubItem key={item.title} className="my-1">
                        <SidebarMenuSubButton
                          asChild
                          isActive={isRouteActive(item.url)}
                          className="text-base py-5 px-4 transition-all duration-100"
                        >
                          <Link href={item.url} className="w-full block font-medium">
                            <item.icon className="w-4 h-4 mr-2" />
                            {item.title}
                          </Link>
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