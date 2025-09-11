"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import Image from "next/image";

export type InstagramPostOption = {
  id: string;
  caption?: string;
  media_url?: string;
  media_type?: string;
  thumbnail_url?: string;
};

type PostPickerProps = {
  label?: string;
  helperText?: string;
  value: string;
  onChange: (value: string) => void;
  posts: InstagramPostOption[];
};

export function PostPicker({
  label = "Select Post *",
  helperText = "One post is required for comment/both scopes.",
  value,
  onChange,
  posts,
}: PostPickerProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="postIds">{label}</Label>
      <RadioGroup value={value} onValueChange={onChange}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {posts.map((p) => (
            <label key={p.id} htmlFor={`post-${p.id}`} className="cursor-pointer">
              <Card
                className={cn(
                  "overflow-hidden transition-shadow py-0",
                  value === p.id ? "ring-2 ring-primary" : "hover:shadow"
                )}
              >
                <CardContent className="p-0">
                  {p.media_type === "VIDEO" && p.thumbnail_url ? (
                    <Image
                      src={p.thumbnail_url}
                      alt={p.caption || p.id}
                      className="h-36 w-full object-cover"
                      loading="lazy"
                      width={100}
                      height={100}
                    />
                  ) : p.media_url ? (
                    <Image
                      src={p.media_url}
                      alt={p.caption || p.id}
                      className="h-36 w-full object-cover"
                      loading="lazy"
                      width={100}
                      height={100}
                    />
                  ) : (
                    <div className="h-36 w-full flex items-center justify-center text-sm text-muted-foreground">
                      no preview
                    </div>
                  )}
                  <div className="p-2 text-xs text-muted-foreground line-clamp-2">
                    {(p.caption || p.id)?.slice(0, 70)}
                  </div>
                </CardContent>
              </Card>
              <div className="sr-only">
                <RadioGroupItem id={`post-${p.id}`} value={p.id} />
              </div>
            </label>
          ))}
        </div>
      </RadioGroup>
      {helperText ? (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}

export default PostPicker;


