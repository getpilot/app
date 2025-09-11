"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, ChevronDown, Trash } from "lucide-react";

type ButtonConfig = { type: "web_url"; title: string; url: string };

type ElementConfig = {
  title: string;
  subtitle?: string;
  image_url?: string;
  default_action_url?: string; // simplified input, maps to default_action.url
  buttons: ButtonConfig[]; // max 3
};

export function GenericTemplateBuilder({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextJson: string) => void;
}) {
  const parsedInitial: ElementConfig[] = useMemo(() => {
    if (!value) return [];
    try {
      const raw = JSON.parse(value);
      if (Array.isArray(raw)) {
        return raw.map((e) => ({
          title: e?.title ?? "",
          subtitle: e?.subtitle ?? "",
          image_url: e?.image_url ?? "",
          default_action_url: e?.default_action?.url ?? "",
          buttons: Array.isArray(e?.buttons)
            ? e.buttons
                .filter((b: any) => b?.type === "web_url")
                .map((b: any) => ({
                  type: "web_url",
                  title: b?.title ?? "",
                  url: b?.url ?? "",
                }))
            : [],
        }));
      }
    } catch {}
    return [];
  }, [value]);

  const [elements, setElements] = useState<ElementConfig[]>(parsedInitial);
  const [openStates, setOpenStates] = useState<boolean[]>(() =>
    elements.map(() => false)
  );

  useEffect(() => {
    // keep openStates length in sync with elements
    setOpenStates((prev) => {
      const next = [...prev];
      if (next.length < elements.length) {
        while (next.length < elements.length) next.push(false);
      } else if (next.length > elements.length) {
        next.length = elements.length;
      }
      return next;
    });
  }, [elements.length]);

  const payloadJson = useMemo(() => {
    const payload = elements.slice(0, 10).map((e) => ({
      title: e.title,
      subtitle: e.subtitle || undefined,
      image_url: e.image_url || undefined,
      default_action: e.default_action_url
        ? { type: "web_url", url: e.default_action_url }
        : undefined,
      buttons: (e.buttons || [])
        .slice(0, 3)
        .map((b) => ({ type: "web_url", url: b.url, title: b.title })),
    }));
    return JSON.stringify(payload);
  }, [elements]);

  useEffect(() => {
    if (payloadJson !== value) {
      onChange(payloadJson);
    }
    // intentionally not depending on onChange to avoid effect thrash when parent recreates handler
  }, [payloadJson, value]);

  const addElement = () => {
    setElements((prev) => [
      ...prev,
      {
        title: "",
        subtitle: "",
        image_url: "",
        default_action_url: "",
        buttons: [],
      },
    ]);
  };

  const removeElement = (idx: number) => {
    setElements((prev) => prev.filter((_, i) => i !== idx));
    setOpenStates((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateElement = (idx: number, patch: Partial<ElementConfig>) => {
    setElements((prev) =>
      prev.map((el, i) => (i === idx ? { ...el, ...patch } : el))
    );
  };

  const addButton = (idx: number) => {
    setElements((prev) =>
      prev.map((el, i) =>
        i === idx
          ? {
              ...el,
              buttons: [
                ...(el.buttons || []),
                { type: "web_url", title: "", url: "" },
              ],
            }
          : el
      )
    );
  };

  const removeButton = (elIdx: number, btnIdx: number) => {
    setElements((prev) =>
      prev.map((el, i) =>
        i === elIdx
          ? { ...el, buttons: el.buttons.filter((_, j) => j !== btnIdx) }
          : el
      )
    );
  };

  const updateButton = (elIdx: number, btnIdx: number, next: ButtonConfig) => {
    setElements((prev) =>
      prev.map((el, i) =>
        i === elIdx
          ? {
              ...el,
              buttons: el.buttons.map((b, j) => (j === btnIdx ? next : b)),
            }
          : el
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Up to 10 elements, each with up to 3 buttons
        </div>
        <Button type="button" variant="outline" onClick={addElement}>
          Add Element
        </Button>
      </div>

      {elements.length === 0 && (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          No elements yet. Click "Add Element" to start.
        </div>
      )}

      {elements.map((el, idx) => (
        <Collapsible
          key={idx}
          open={openStates[idx]}
          onOpenChange={(v) =>
            setOpenStates((prev) => prev.map((val, i) => (i === idx ? v : val)))
          }
        >
          <div className="rounded-md border">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle"
                  >
                    {openStates[idx] ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <div className="font-medium">
                  {el.title || `Element ${idx + 1}`}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove Element"
                onClick={() => removeElement(idx)}
              >
                <Trash className="size-4 text-destructive" />
              </Button>
            </div>
            <CollapsibleContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={el.title}
                    onChange={(e) =>
                      updateElement(idx, { title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={el.subtitle || ""}
                    onChange={(e) =>
                      updateElement(idx, { subtitle: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={el.image_url || ""}
                    onChange={(e) =>
                      updateElement(idx, { image_url: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Action URL</Label>
                  <Input
                    value={el.default_action_url || ""}
                    onChange={(e) =>
                      updateElement(idx, { default_action_url: e.target.value })
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Buttons</Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addButton(idx)}
                    disabled={(el.buttons || []).length >= 3}
                  >
                    Add Button
                  </Button>
                </div>
                {(el.buttons || []).length === 0 && (
                  <div className="rounded border p-3 text-sm text-muted-foreground">
                    No buttons. Add up to 3.
                  </div>
                )}
                <div className="space-y-3">
                  {(el.buttons || []).map((b, j) => (
                    <div
                      key={j}
                      className="rounded-md border p-3 flex flex-col gap-3 w-full"
                    >
                      <div className="flex flex-col md:flex-row gap-3 w-full">
                        <div className="w-full">
                          <Label className="block mb-1">Title</Label>
                          <Input
                            value={b.title}
                            onChange={(e) =>
                              updateButton(idx, j, {
                                ...b,
                                title: e.target.value,
                              } as ButtonConfig)
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeButton(idx, j)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col w-full">
                        <div className="w-full">
                          <Label className="block mb-1">URL</Label>
                          <Input
                            value={(b as any).url || ""}
                            onChange={(e) =>
                              updateButton(idx, j, {
                                ...(b as any),
                                url: e.target.value,
                              } as ButtonConfig)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* removed in-content remove; removal handled by header trash icon */}
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  );
}