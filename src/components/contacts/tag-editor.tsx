"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { addContactTagAction, removeContactTagAction } from "@/actions/contacts";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TagEditorProps {
  contactId: string;
  initialTags: string[];
  className?: string;
}

export default function TagEditor({ contactId, initialTags, className }: TagEditorProps) {
  const [tags, setTags] = useState<string[]>(initialTags || []);
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const normalizedExisting = useMemo(
    () => new Set((tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean)),
    [tags]
  );

  const addTag = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (t.length > 24) {
      toast.error("tag too long (max 24)");
      return;
    }
    if (normalizedExisting.has(t.toLowerCase())) {
      toast.message("tag already exists");
      return;
    }

    const optimistic = [...tags, t];
    setTags(optimistic);
    setValue("");

    startTransition(async () => {
      const res = await addContactTagAction(contactId, t);
      if (!res?.success) {
        setTags(tags);
        toast.error(res?.error || "failed to add tag");
      } else {
        toast.success("tag added");
      }
    });
  };

  const removeTag = (t: string) => {
    const optimistic = tags.filter((x) => x !== t);
    setTags(optimistic);
    startTransition(async () => {
      const res = await removeContactTagAction(contactId, t);
      if (!res?.success) {
        setTags(tags);
        toast.error(res?.error || "failed to remove tag");
      } else {
        toast.success("tag removed");
      }
    });
  };

  const preview = tags.slice(0, 3);
  const overflow = Math.max(0, (tags?.length || 0) - preview.length);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex flex-wrap items-center gap-1 min-h-[28px]">
        {preview.map((t) => (
          <Badge key={t} variant="secondary" className="capitalize">
            {t}
          </Badge>
        ))}
        {overflow > 0 && (
          <Badge variant="outline" className="text-xs">+{overflow}</Badge>
        )}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="edit tags"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="flex items-center gap-1">
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="inline-flex p-0.5 rounded-sm hover:bg-muted"
                    aria-label={`remove ${t}`}
                    disabled={isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {tags.length === 0 && (
                <span className="text-xs text-muted-foreground">no tags yet</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(value);
                  }
                }}
                placeholder="add a tag and press enter"
                className="h-8"
                disabled={isPending}
              />
              <Button size="sm" variant="outline" onClick={() => addTag(value)} disabled={isPending}>
                Add
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}