import { ReactNode } from "react";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
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

  const userData = await db
    .select({ onboarding_complete: user.onboarding_complete })
    .from(user)
    .where(eq(user.id, session.user.id))
    .then((res) => res[0]);
  
  if (userData?.onboarding_complete) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden md:flex flex-col w-2/5 bg-primary text-white p-8 justify-between">
        <div className="space-y-8">
          <div className="font-bold text-3xl">Pilot</div>
          <h1 className="text-4xl font-bold leading-tight">
            A few clicks away from creating your AI-first CRM workspace.
          </h1>
          
          <p className="text-white/90 text-lg">
            Pilot is an AI-first CRM that qualifies, tags, and follows up on leads without a real-time unified inbox.
          </p>
        </div>

        <p className="text-white/90 text-lg">
          Built for creators closing deals in DMs, Pilot acts like an intelligent sales assistant: it listens, learns tone, and executes, freeing up time and mental overhead.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}