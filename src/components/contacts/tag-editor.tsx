"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Tag, Edit3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addContactTagAction,
  removeContactTagAction,
  getUserTagsAction,
} from "@/actions/contacts";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "../ui/label";

interface TagEditorProps {
  contactId: string;
  initialTags: string[];
  className?: string;
  maxTags?: number;
  placeholder?: string;
}

export default function TagEditor({
  contactId,
  initialTags,
  className,
  maxTags = 10,
  placeholder = "Add a tag...",
}: TagEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [userTagsLoading, setUserTagsLoading] = useState(false);

  const normalizedExisting = useMemo(
    () =>
      new Set((tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean)),
    [tags]
  );

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;

    if (tags.length >= maxTags) {
      toast.error(`Maximum ${maxTags} tags allowed`);
      return;
    }

    if (t.length > 24) {
      toast.error("Tag too long (max 24 characters)");
      return;
    }

    if (normalizedExisting.has(t.toLowerCase())) {
      toast("Tag already exists");
      return;
    }

    const prev = tags;
    const optimistic = [...prev, t];
    setTags(optimistic);
    setValue("");

    startTransition(async () => {
      try {
        const res = await addContactTagAction(contactId, t);
        if (!res?.success) {
          setTags(prev);
          toast.error(res?.error || "Failed to add tag");
        } else {
          toast.success("Tag added successfully");
        }
      } catch (e: unknown) {
        setTags(prev);
        const message = e instanceof Error ? e.message : "Failed to add tag";
        toast.error(message);
      }
    });
  };

  const removeTag = (t: string) => {
    const prev = tags;
    const optimistic = prev.filter((x) => x !== t);
    setTags(optimistic);

    startTransition(async () => {
      try {
        const res = await removeContactTagAction(contactId, t);
        if (!res?.success) {
          setTags(prev);
          toast.error(res?.error || "Failed to remove tag");
        } else {
          toast.success("Tag removed");
        }
      } catch (e: unknown) {
        setTags(prev);
        const message = e instanceof Error ? e.message : "Failed to remove tag";
        toast.error(message);
      }
    });
  };

  const preview = tags.slice(0, 3);
  const overflow = Math.max(0, (tags?.length || 0) - preview.length);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
        {preview.map((t) => (
          <Badge
            key={t}
            className={cn(
              "font-medium text-xs px-2.5 py-1 rounded-full",
              "bg-secondary/80 text-secondary-foreground border border-border"
            )}
          >
            {t}
          </Badge>
        ))}

        {overflow > 0 && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 py-1 font-medium",
              "border-dashed border-border text-muted-foreground",
              "hover:border-muted-foreground/50 hover:text-foreground"
            )}
          >
            +{overflow}
          </Badge>
        )}

        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground/70 italic flex items-center gap-1">
            <Tag className="h-3 w-3 opacity-40" />
            No tags
          </span>
        )}
      </div>

      <Popover
        open={isOpen}
        onOpenChange={(next) => {
          setIsOpen(next);
          if (next && userTags.length === 0 && !userTagsLoading) {
            setUserTagsLoading(true);
            startTransition(async () => {
              try {
                const res = await getUserTagsAction();
                if (res?.success && Array.isArray(res.tags)) {
                  setUserTags(res.tags);
                } else if (!res?.success) {
                  toast.error(res?.error || "Failed to load tags");
                }
              } catch (e: unknown) {
                const message =
                  e instanceof Error ? e.message : "Failed to load tags";
                toast.error(message);
              } finally {
                setUserTagsLoading(false);
              }
            });
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "hover:bg-muted/80",
              "group",
              "border border-transparent hover:border-border/50"
            )}
            aria-label="Edit tags"
          >
            <Edit3 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className={cn(
            "w-80 p-0 bg-popover backdrop-blur-sm border border-border"
          )}
          sideOffset={8}
        >
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Settings className="h-3.5 w-3.5 text-primary" />
                </div>
                <h4 className="font-semibold text-sm text-foreground">
                  Manage Tags
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {tags.length}/{maxTags}
                </span>
                {tags.length >= maxTags && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                    Full
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {userTagsLoading && (
                <div className="text-xs text-muted-foreground">
                  Loading your tags…
                </div>
              )}
              {userTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Your Tags
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {userTags.map((t) => {
                      const selected = normalizedExisting.has(t.toLowerCase());
                      const atLimit = tags.length >= maxTags;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            if (!selected && !atLimit) addTag(t);
                          }}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-full border",
                            selected
                              ? "bg-muted cursor-default text-muted-foreground"
                              : atLimit
                              ? "opacity-60 cursor-not-allowed"
                              : "hover:bg-muted cursor-pointer"
                          )}
                          aria-label={`use tag ${t}`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "flex flex-wrap gap-2 min-h-[60px] p-3 rounded-lg",
                  "bg-muted/30 border border-dashed border-border"
                )}
              >
                {tags.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className={cn(
                      "flex items-center gap-1.5 pr-1 group",
                      "bg-secondary text-secondary-foreground border border-border",
                      "hover:bg-secondary/80 hover:border-border"
                    )}
                  >
                    <span className="capitalize font-medium text-sm">{t}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className={cn(
                        "inline-flex p-0.5 rounded-full",
                        "hover:bg-destructive/20 hover:text-destructive",
                        "opacity-60 group-hover:opacity-100"
                      )}
                      aria-label={`Remove ${t}`}
                      disabled={isPending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                {tags.length === 0 && (
                  <div className="flex items-center justify-center w-full py-3 text-muted-foreground">
                    <div className="text-center space-y-2">
                      <div className="p-2 rounded-full bg-muted/50 w-fit mx-auto">
                        <Tag className="h-5 w-5 opacity-40" />
                      </div>
                      <p className="text-xs font-medium">No tags added yet</p>
                      <p className="text-xs opacity-70">
                        Add your first tag below
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Add New Tag
              </Label>
              <div className="flex gap-2">
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(value);
                    }
                    if (e.key === "Escape") {
                      setIsOpen(false);
                    }
                  }}
                  placeholder={placeholder}
                  className={cn(
                    "h-9 bg-background border-border/50",
                    "focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
                    "placeholder:text-muted-foreground/50"
                  )}
                  disabled={isPending || tags.length >= maxTags}
                  maxLength={24}
                />
                <Button
                  size="sm"
                  onClick={() => addTag(value)}
                  disabled={
                    isPending || !value.trim() || tags.length >= maxTags
                  }
                  className={cn(
                    "h-9 px-4 bg-primary text-primary-foreground",
                    "hover:bg-primary/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isPending ? (
                    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {value.length > 15 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {24 - value.length} characters remaining
                  </span>
                  {value.length > 20 && (
                    <span className="text-amber-600 font-medium">
                      Almost at limit
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}