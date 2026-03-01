"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@pilot/ui/components/card";
import { Badge } from "@pilot/ui/components/badge";
import { Avatar, AvatarFallback } from "@pilot/ui/components/avatar";
import { Button } from "@pilot/ui/components/button";
import { Skeleton } from "@pilot/ui/components/skeleton";
import { Input } from "@pilot/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pilot/ui/components/select";
import { CheckIcon } from "lucide-react";
import { fetchHRNContacts, updateContactHRNState } from "@/actions/contacts";
import { toast } from "sonner";
import { ScrollArea } from "@pilot/ui/components/scroll-area";
import { cn } from "@pilot/ui/lib/utils";
import { InstagramContact } from "@pilot/types/instagram";

type SortKey = "score_desc" | "value_desc" | "hrn_time_asc" | "hrn_time_desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "hrn_time_desc", label: "Newest HRN first" },
  { value: "hrn_time_asc", label: "Oldest HRN first" },
  { value: "score_desc", label: "Lead Score ↓" },
  { value: "value_desc", label: "Lead Value ↓" },
];

const SENTIMENT_CHIPS = ["hot", "warm", "cold", "neutral"] as const;

const SENTIMENT_COLORS: Record<string, string> = {
  hot: "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 border-red-400",
  warm: "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-400",
  cold: "bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border-sky-400",
  neutral:
    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-400",
};

async function fetchContactsAction(
  setContacts: (v: InstagramContact[]) => void,
  setLoading: (v: boolean) => void
) {
  try {
    const hrnContacts = await fetchHRNContacts();
    setContacts(hrnContacts);
  } catch (error) {
    console.error("Failed to fetch HRN contacts:", error);
  } finally {
    setLoading(false);
  }
}

async function handleResolveAction(
  contactId: string,
  setUpdating: (v: string | null) => void,
  setContacts: (v: InstagramContact[]) => void,
  setLoading: (v: boolean) => void
) {
  try {
    setUpdating(contactId);
    const res = await updateContactHRNState(contactId, {
      requiresHumanResponse: false,
    });
    if (!res.success) {
      toast.error(res.error || "Failed to clear HRN");
      return;
    }
    toast.success("HRN cleared. Bot re-enabled.");
    await fetchContactsAction(setContacts, setLoading);
  } catch (error) {
    console.error("Failed to update HRN state:", error);
    toast.error("Something went wrong. Try again?");
  } finally {
    setUpdating(null);
  }
}

export function HRNList() {
  const [contacts, setContacts] = useState<InstagramContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Prioritization controls
  const [sortKey, setSortKey] = useState<SortKey>("hrn_time_desc");
  const [selectedSentiments, setSelectedSentiments] = useState<Set<string>>(
    new Set()
  );
  const [minScore, setMinScore] = useState<number | "">("");

  useEffect(() => {
    void fetchContactsAction(setContacts, setLoading);
  }, []);

  const handleResolve = (contactId: string) =>
    handleResolveAction(contactId, setUpdating, setContacts, setLoading);

  const toggleSentiment = (s: string) => {
    setSelectedSentiments((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const formatTime = (ts?: string) => {
    if (!ts) return "Unknown";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "Unknown";
    }
  };

  // Client-side filter + sort
  const filteredSorted = useMemo(() => {
    let list = [...contacts];

    // Sentiment filter
    if (selectedSentiments.size > 0) {
      list = list.filter((c) =>
        c.sentiment ? selectedSentiments.has(c.sentiment) : false
      );
    }

    // Score threshold
    if (minScore !== "" && typeof minScore === "number") {
      list = list.filter((c) => (c.leadScore ?? 0) >= minScore);
    }

    // Sort
    list.sort((a, b) => {
      switch (sortKey) {
        case "score_desc":
          return (b.leadScore ?? 0) - (a.leadScore ?? 0);
        case "value_desc":
          return (b.leadValue ?? 0) - (a.leadValue ?? 0);
        case "hrn_time_asc":
          return (
            new Date(a.humanResponseSetAt ?? 0).getTime() -
            new Date(b.humanResponseSetAt ?? 0).getTime()
          );
        case "hrn_time_desc":
        default:
          return (
            new Date(b.humanResponseSetAt ?? 0).getTime() -
            new Date(a.humanResponseSetAt ?? 0).getTime()
          );
      }
    });

    return list;
  }, [contacts, sortKey, selectedSentiments, minScore]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>HRN Needed</CardTitle>
          <CardDescription>
            Collecting threads that are paused for human reply.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-lg border p-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-28 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>HRN Needed ({contacts.length})</CardTitle>
        <CardDescription>
          Conversations the bot paused—respond quickly to keep momentum.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <h4 className="font-medium">Nothing in HRN right now.</h4>
            <p className="text-sm text-muted-foreground">
              Sidekick will route risky threads here for human review.
            </p>
          </div>
        ) : (
          <>
            {/* --- Prioritization controls --- */}
            <div className="mb-3 space-y-2">
              {/* Row 1: sort + score threshold */}
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={sortKey}
                  onValueChange={(v) => setSortKey(v as SortKey)}
                >
                  <SelectTrigger className="w-[180px] border-border">
                    <SelectValue placeholder="Sort by…" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Score ≥
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    className="w-18 border-border"
                    value={minScore}
                    onChange={(e) =>
                      setMinScore(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              {/* Row 2: sentiment chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {SENTIMENT_CHIPS.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className={cn(
                      "cursor-pointer text-xs select-none transition-colors border",
                      selectedSentiments.has(s)
                        ? SENTIMENT_COLORS[s]
                        : "text-muted-foreground border-border hover:border-foreground/40"
                    )}
                    onClick={() => toggleSentiment(s)}
                  >
                    {s}
                  </Badge>
                ))}
                {selectedSentiments.size > 0 && (
                  <button
                    className="text-[10px] text-muted-foreground underline ml-1"
                    onClick={() => setSelectedSentiments(new Set())}
                  >
                    clear
                  </button>
                )}
              </div>

              {/* Active filter count */}
              {filteredSorted.length !== contacts.length && (
                <p className="text-xs text-muted-foreground">
                  Showing {filteredSorted.length} of {contacts.length}
                </p>
              )}
            </div>

            <ScrollArea className="max-h-full h-[300px] pr-1 mt-4">
              <div className="space-y-3">
                {filteredSorted.length === 0 ? (
                  <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
                    No contacts match the current filters.
                  </div>
                ) : (
                  filteredSorted.map((contact) => (
                    <div key={contact.id} className="rounded-lg border p-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-10 border">
                          <AvatarFallback>
                            {contact.name?.slice(0, 2)?.toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">
                                {contact.name}
                              </h4>
                              <Badge variant="outline">
                                {contact.stage || "new"}
                              </Badge>
                              {contact.sentiment && (
                                <Badge variant="secondary">
                                  {contact.sentiment}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs whitespace-nowrap text-muted-foreground">
                              HRN set:{" "}
                              {formatTime(contact.humanResponseSetAt)}
                            </span>
                          </div>

                          {contact.lastMessage && (
                            <p className="text-sm line-clamp-2 text-pretty">
                              {contact.lastMessage}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {contact.leadScore != null && (
                                <span className="text-xs">
                                  Score: {contact.leadScore}
                                </span>
                              )}
                              {contact.leadValue != null &&
                                contact.leadValue > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    Value: ${contact.leadValue}
                                  </span>
                                )}
                            </div>
                            <Button
                              size="sm"
                              className="min-w-[9rem]"
                              variant="default"
                              onClick={() => handleResolve(contact.id)}
                              disabled={updating === contact.id}
                            >
                              <CheckIcon
                                className="size-4"
                                aria-hidden="true"
                              />
                              {updating === contact.id
                                ? "Updating..."
                                : "Mark handled"}
                            </Button>
                          </div>

                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}

