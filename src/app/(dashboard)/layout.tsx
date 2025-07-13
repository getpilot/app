import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/sidebar";
import SiteHeader from "@/components/dashboard/page-header";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
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
    console.error("Failed to fetch user onboarding status:", error);
    redirect("/onboarding");
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="flex flex-1 flex-col bg-muted">
        <SiteHeader />
        <main className="px-8 py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}