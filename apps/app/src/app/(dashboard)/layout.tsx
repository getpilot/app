import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import { db } from "@pilot/db";
import { user } from "@pilot/db/schema";
import { eq } from "drizzle-orm";
import { SidebarInset, SidebarProvider } from "@pilot/ui/components/sidebar";
import { AppSidebar } from "@/components/dashboard/sidebar";
import PageHeader from "@/components/dashboard/page-header";
import { SidekickToggle } from "@/components/sidekick/toggle";
import { SidekickProvider } from "@/components/sidekick/context";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  try {
    const userData = await db
      .select({ onboarding_complete: user.onboarding_complete })
      .from(user)
      .where(eq(user.id, session.user.id))
      .then((res) => res[0]);

    if (!userData) {
      console.error("User data not found");
      redirect("/onboarding");
    }

    if (!userData.onboarding_complete) {
      redirect("/onboarding");
    }
  } catch (error) {
    unstable_rethrow(error);
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
              "min(33rem, calc((100vw - (var(--spacing) * 72)) * 0.4))",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col bg-background border">
          <PageHeader />
          <main className="px-8 py-6">{children}</main>
        </SidebarInset>
        <SidekickToggle />
      </SidebarProvider>
    </SidekickProvider>
  );
}
