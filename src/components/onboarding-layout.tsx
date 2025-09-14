import { ReactNode } from "react";
import { getUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";

interface OnboardingLayoutProps {
  children: ReactNode;
  title: string;
  heading: string;
  subheading: string;
  footer: string;
}

export default async function OnboardingLayout({
  children,
  title,
  heading,
  subheading,
  footer,
}: OnboardingLayoutProps) {
  const user = await getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="hidden md:flex flex-col w-2/5 bg-primary text-white p-8 justify-between">
        <div className="space-y-8">
          <div className="font-bold text-3xl">{title}</div>
          <h1 className="text-4xl font-bold leading-tight">{heading}</h1>

          <p className="text-white/90 text-lg">{subheading}</p>
        </div>

        <p className="text-white/90 text-lg">{footer}</p>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto">
        {children}
      </div>
    </div>
  );
}