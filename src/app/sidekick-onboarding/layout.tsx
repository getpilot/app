import { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SidekickOnboardingLayout({
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

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="hidden md:flex flex-col w-2/5 bg-primary text-white p-8 justify-between">
        <div className="space-y-8">
          <div className="font-bold text-3xl">Pilot Sidekick</div>
          <h1 className="text-4xl font-bold leading-tight">
            Let's teach Sidekick how to sell like you.
          </h1>
          
          <p className="text-white/90 text-lg">
            This takes 2 minutes. Then it'll run your DMs for you.
          </p>
        </div>

        <p className="text-white/90 text-lg">
          Sidekick is your AI sales assistant inside the Unified Inbox. It captures sales context, tone, objections, and offers to help you close more deals.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto">
        {children}
      </div>
    </div>
  );
}