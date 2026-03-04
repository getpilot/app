"use client";

import { useEffect, useState } from "react";
import { Button } from "@pilot/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@pilot/ui/components/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@pilot/ui/components/avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircleIcon, LogOutIcon } from "lucide-react";
import { cn } from "@pilot/ui/lib/utils";
import { useSidebar } from "@pilot/ui/components/sidebar";
import { getUserProfile } from "@/actions/sidekick/ai-tools/user-profile";

type UserQuotaSummary = {
  exceeded: boolean;
  planName: string;
  usage: {
    contactsTotal: number;
    newContactsThisMonth: number;
    automationsTotal: number;
    sidekickSendsThisMonth: number;
    sidekickChatPromptsThisMonth: number;
  };
  limits: {
    maxContactsTotal: number | null;
    maxNewContactsPerMonth: number | null;
    maxAutomations: number | null;
    maxSidekickSendsPerMonth: number | null;
    maxSidekickChatPromptsPerMonth: number | null;
  };
};

function useUserQuotaSummary() {
  const [quota, setQuota] = useState<UserQuotaSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    getUserProfile()
      .then((result) => {
        if (!cancelled && result.success) {
          setQuota((result.profile as { quota?: UserQuotaSummary }).quota ?? null);
        }
      })
      .catch((error) => {
        console.error("Failed to load user quota summary:", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return quota;
}

function formatQuotaLine(used: number, limit: number | null, label: string) {
  return `${label}: ${used}${limit === null ? "" : ` / ${limit}`}`;
}

function AvatarAlertBadge() {
  return (
    <span className="absolute -right-0.5 -top-0.5 rounded-full bg-destructive p-0.5 text-destructive-foreground shadow-sm">
      <AlertCircleIcon className="size-3.5" />
    </span>
  );
}

function ProfileAvatar({
  image,
  name,
  sizeClassName,
  showAlert,
}: {
  image?: string | null;
  name?: string | null;
  sizeClassName?: string;
  showAlert: boolean;
}) {
  return (
    <div className={cn("relative", sizeClassName)}>
      <Avatar className={cn("size-full", sizeClassName)}>
        <AvatarImage
          src={image ?? ""}
          alt={name ?? ""}
          className="rounded-full"
        />
        <AvatarFallback className="rounded-full">
          {name?.charAt(0)}
        </AvatarFallback>
      </Avatar>
      {showAlert ? <AvatarAlertBadge /> : null}
    </div>
  );
}

export function UserProfile({ className }: { className?: string }) {
  const [signingOut, setSigningOut] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const quota = useUserQuotaSummary();

  if (isPending) {
    return (
      <div className="size-10 md:size-14 aspect-square flex items-center justify-center p-3">
        <div className="size-4 md:size-8 rounded-full bg-muted/50 animate-pulse"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "size-14 aspect-square p-2 md:p-3",
            signingOut && "animate-pulse",
            className
          )}
          asChild
        >
          <ProfileAvatar
            image={session.user.image}
            name={session.user.name}
            showAlert={Boolean(quota?.exceeded)}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-75">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <p className="font-medium leading-none">{session.user.name}</p>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>
            <ProfileAvatar
              image={session.user.image}
              name={session.user.name}
              sizeClassName="size-8"
              showAlert={Boolean(quota?.exceeded)}
            />
          </div>
          {quota ? (
            <div className="rounded-lg border p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{quota.planName} usage</p>
              <p>{formatQuotaLine(quota.usage.contactsTotal, quota.limits.maxContactsTotal, "Contacts")}</p>
              <p>{formatQuotaLine(quota.usage.newContactsThisMonth, quota.limits.maxNewContactsPerMonth, "New contacts this month")}</p>
              <p>{formatQuotaLine(quota.usage.automationsTotal, quota.limits.maxAutomations, "Automations")}</p>
              <p>{formatQuotaLine(quota.usage.sidekickSendsThisMonth, quota.limits.maxSidekickSendsPerMonth, "AI sends this month")}</p>
              <p>{formatQuotaLine(quota.usage.sidekickChatPromptsThisMonth, quota.limits.maxSidekickChatPromptsPerMonth, "Sidekick chats this month")}</p>
            </div>
          ) : null}
        </div>
        {/* <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href="/"></Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <a
            href={siteConfig.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between gap-2"
          >
            <span>Github</span>
            <ExternalLinkIcon className="size-4" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <a
            href={siteConfig.socials.x}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between gap-2"
          >
            <span>X</span>
            <ExternalLinkIcon className="size-4" />
          </a>
        </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer w-full flex items-center justify-between gap-2"
          onClick={() =>
            signOut({
              fetchOptions: {
                onRequest: () => {
                  setSigningOut(true);
                  toast.loading("Signing out...");
                },
                onSuccess: () => {
                  setSigningOut(false);
                  toast.success("Signed out successfully");
                  toast.dismiss();
                  router.push("/sign-in");
                },
                onError: () => {
                  setSigningOut(false);
                  toast.error("Failed to sign out");
                },
              },
            })
          }
        >
          <span>Sign Out</span>
          <LogOutIcon className="size-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserProfileDesktop({ className }: { className?: string }) {
  const { isMobile } = useSidebar()
  const [signingOut, setSigningOut] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const quota = useUserQuotaSummary();

  if (isPending) {
    return (
      <div className="w-full p-4 flex items-center justify-center">
        <div className="h-12 w-full rounded-lg bg-muted/50 animate-pulse"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={cn("w-full p-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg h-14",
              signingOut && "animate-pulse"
            )}
          >
            <ProfileAvatar
              image={session.user.image}
              name={session.user.name}
              sizeClassName="size-10 shrink-0"
              showAlert={Boolean(quota?.exceeded)}
            />
            <div className="flex flex-col items-start text-left overflow-hidden">
              <p className="font-medium truncate w-full">{session.user.name}</p>
              <p className="text-xs text-muted-foreground truncate w-full">
                {session.user.email}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[300px] rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <p className="font-medium leading-none">{session.user.name}</p>
                <p className="text-sm text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
              <ProfileAvatar
                image={session.user.image}
                name={session.user.name}
                sizeClassName="size-8"
                showAlert={Boolean(quota?.exceeded)}
              />
            </div>
            {quota ? (
              <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">{quota.planName} usage</p>
                <p>{formatQuotaLine(quota.usage.contactsTotal, quota.limits.maxContactsTotal, "Contacts")}</p>
                <p>{formatQuotaLine(quota.usage.newContactsThisMonth, quota.limits.maxNewContactsPerMonth, "New contacts this month")}</p>
                <p>{formatQuotaLine(quota.usage.automationsTotal, quota.limits.maxAutomations, "Automations")}</p>
                <p>{formatQuotaLine(quota.usage.sidekickSendsThisMonth, quota.limits.maxSidekickSendsPerMonth, "AI sends this month")}</p>
                <p>{formatQuotaLine(quota.usage.sidekickChatPromptsThisMonth, quota.limits.maxSidekickChatPromptsPerMonth, "Sidekick chats this month")}</p>
              </div>
            ) : null}
          </div>
          {/* <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href="/"></Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a
              href={siteConfig.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between gap-2"
            >
              <span>Github</span>
              <ExternalLinkIcon className="size-4" />
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <a
              href={siteConfig.socials.x}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between gap-2"
            >
              <span>X</span>
              <ExternalLinkIcon className="size-4" />
            </a>
          </DropdownMenuItem> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer w-full flex items-center justify-between gap-2"
            onClick={() =>
              signOut({
                fetchOptions: {
                  onRequest: () => {
                    setSigningOut(true);
                    toast.loading("Signing out...");
                  },
                  onSuccess: () => {
                    setSigningOut(false);
                    toast.success("Signed out successfully");
                    toast.dismiss();
                    router.push("/sign-in");
                  },
                  onError: () => {
                    setSigningOut(false);
                    toast.error("Failed to sign out");
                  },
                },
              })
            }
          >
            <span>Sign Out</span>
            <LogOutIcon className="size-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
