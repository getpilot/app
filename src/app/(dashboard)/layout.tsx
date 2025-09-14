import { ReactNode } from "react";
import { getUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { convex, api } from "@/lib/convex-client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/sidebar";
import PageHeader from "@/components/dashboard/page-header";
import { SidekickToggle } from "@/components/sidekick/toggle";
import { SidekickProvider } from "@/components/sidekick/context";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  try {
    const userData = await convex.query(api.user.getUser, {
      id: user._id,
    });

    if (!userData) {
      console.error("User data not found");
      redirect("/onboarding");
    }

    if (!userData.onboarding_complete) {
      redirect("/onboarding");
    }
  } catch (error) {
    console.error("Failed to fetch user onboarding status:", error);
    redirect("/onboarding");
  }

  return (
    <SidekickProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
            "--sidebar-right-width":
              "calc((100vw - (var(--spacing) * 72)) * 0.4)",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col bg-muted">
          <PageHeader />
          <main className="px-8 py-6">{children}</main>
        </SidebarInset>
        <SidekickToggle />
      </SidebarProvider>
    </SidekickProvider>
  );
}