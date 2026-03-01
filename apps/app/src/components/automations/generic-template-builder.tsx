"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@pilot/ui/components/button";
import { Input } from "@pilot/ui/components/input";
import { Label } from "@pilot/ui/components/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@pilot/ui/components/collapsible";
import { ChevronRight, ChevronDown, Trash } from "lucide-react";
import { uploadImage } from "@/actions/upload";

type WebUrlButton = { type: "web_url"; title: string; url: string };

type ButtonConfig = WebUrlButton;

type ElementConfig = {
  title: string;
  subtitle?: string;
  image_url?: string;
  default_action_url?: string; // simplified input, maps to default_action.url
  buttons: ButtonConfig[]; // max 3
};

type IncomingElement = {
  title?: string;
  subtitle?: string;
  image_url?: string;
  default_action?: { type?: string; url?: string };
  buttons?: Array<{ type?: string; title?: string; url?: string }>;
};

async function uploadImageForElement(
  idx: number,
  base64: string,
  eventTarget: HTMLInputElement | null,
  setUploading: (updater: (prev: Record<number, boolean>) => Record<number, boolean>) => void,
  updateEl: (idx: number, patch: Partial<ElementConfig>) => void
) {
  try {
    setUploading((prev) => ({ ...prev, [idx]: true }));
    const secureUrl = await uploadImage(base64, "pilot-automations/generic-template");
    updateEl(idx, { image_url: secureUrl });
  } catch (err) {
    console.error("image upload failed", err);
  } finally {
    setUploading((prev) => ({ ...prev, [idx]: false }));
    if (eventTarget) {
      eventTarget.value = "";
    }
  }
}

function parseGenericTemplateValue(value: string): ElementConfig[] {
  if (!value) return [];
  try {
    const raw = JSON.parse(value) as unknown;
    if (Array.isArray(raw)) {
      return (raw as IncomingElement[]).map((e) => ({
        title: e?.title ?? "",
        subtitle: e?.subtitle ?? "",
        image_url: e?.image_url ?? "",
        default_action_url: e?.default_action?.url ?? "",
        buttons: Array.isArray(e?.buttons)
          ? e.buttons
            .filter((b) => b?.type === "web_url")
            .map((b) => ({
              type: "web_url" as const,
              title: b?.title ?? "",
              url: b?.url ?? "",
            }))
          : [],
      }));
    }
  } catch { }
  return [];
}

export function GenericTemplateBuilder({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextJson: string) => void;
}) {
  const parsedInitial: ElementConfig[] = useMemo(
    () => parseGenericTemplateValue(value),
    [value]
  );

  const [draftState, setDraftState] = useState<{
    sourceValue: string;
    elements: ElementConfig[];
    openStates: boolean[];
  } | null>(null);
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const activeDraft = draftState?.sourceValue === value ? draftState : null;
  const elements = activeDraft?.elements ?? parsedInitial;
  const openStates = activeDraft?.openStates ?? parsedInitial.map(() => false);

  const payloadJson = useMemo(() => {
    const payload = elements.slice(0, 10).map((e) => ({
      title: e.title,
      subtitle: e.subtitle || undefined,
      image_url: e.image_url || undefined,
      default_action: e.default_action_url
        ? { type: "web_url" as const, url: e.default_action_url }
        : undefined,
      buttons: (e.buttons || [])
        .slice(0, 3)
        .map((b) => ({ type: "web_url" as const, url: b.url, title: b.title })),
    }));
    return JSON.stringify(payload);
  }, [elements]);

  // stable onChange ref to satisfy exhaustive-deps without re-triggering
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (payloadJson !== value) {
      onChangeRef.current(payloadJson);
    }
  }, [payloadJson, value]);

  const updateDraftState = (
    updater: (current: {
      elements: ElementConfig[];
      openStates: boolean[];
    }) => {
      elements: ElementConfig[];
      openStates: boolean[];
    }
  ) => {
    setDraftState((prev) => {
      const current =
        prev?.sourceValue === value
          ? prev
          : {
            sourceValue: value,
            elements: parsedInitial,
            openStates: parsedInitial.map(() => false),
          };

      const next = updater({
        elements: current.elements,
        openStates: current.openStates,
      });

      return {
        sourceValue: value,
        elements: next.elements,
        openStates: next.openStates,
      };
    });
  };

  const addElement = () => {
    updateDraftState((current) => ({
      elements: [
        ...current.elements,
        {
          title: "",
          subtitle: "",
          image_url: "",
          default_action_url: "",
          buttons: [],
        },
      ],
      openStates: [...current.openStates, false],
    }));
  };

  const removeElement = (idx: number) => {
    updateDraftState((current) => ({
      elements: current.elements.filter((_, i) => i !== idx),
      openStates: current.openStates.filter((_, i) => i !== idx),
    }));
  };

  const updateElement = (idx: number, patch: Partial<ElementConfig>) => {
    updateDraftState((current) => ({
      elements: current.elements.map((el, i) =>
        i === idx ? { ...el, ...patch } : el
      ),
      openStates: current.openStates,
    }));
  };

  const addButton = (idx: number) => {
    updateDraftState((current) => ({
      elements: current.elements.map((el, i) =>
        i === idx
          ? {
            ...el,
            buttons: [
              ...(el.buttons || []),
              { type: "web_url", title: "", url: "" },
            ],
          }
          : el
      ),
      openStates: current.openStates,
    }));
  };

  const removeButton = (elIdx: number, btnIdx: number) => {
    updateDraftState((current) => ({
      elements: current.elements.map((el, i) =>
        i === elIdx
          ? { ...el, buttons: el.buttons.filter((_, j) => j !== btnIdx) }
          : el
      ),
      openStates: current.openStates,
    }));
  };

  const updateButton = (elIdx: number, btnIdx: number, next: ButtonConfig) => {
    updateDraftState((current) => ({
      elements: current.elements.map((el, i) =>
        i === elIdx
          ? {
            ...el,
            buttons: el.buttons.map((b, j) => (j === btnIdx ? next : b)),
          }
          : el
      ),
      openStates: current.openStates,
    }));
  };

  const fileInputsRef = useRef<Record<number, HTMLInputElement | null>>({});

  const handlePickImage = (idx: number) => {
    const input = fileInputsRef.current[idx];
    input?.click();
  };

  const handleFileChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    const target = e.target;
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1] || "";
      uploadImageForElement(idx, base64, target, setUploading, updateElement);
    };
    reader.readAsDataURL(file);
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
          No elements yet. Click &quot;Add Element&quot; to start.
        </div>
      )}

      {elements.map((el, idx) => (
        <Collapsible
          key={idx}
          open={openStates[idx]}
          onOpenChange={(v) =>
            updateDraftState((current) => ({
              elements: current.elements,
              openStates: current.openStates.map((val, i) =>
                i === idx ? v : val
              ),
            }))
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
                <Trash className="size-4" />
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
                  <div className="flex gap-2">
                    <Input
                      value={el.image_url || ""}
                      onChange={(e) =>
                        updateElement(idx, { image_url: e.target.value })
                      }
                      placeholder="https://..."
                      disabled={uploading[idx] === true}
                    />
                    <input
                      ref={(node) => {
                        fileInputsRef.current[idx] = node;
                      }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(idx, e)}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handlePickImage(idx)}
                      disabled={uploading[idx] === true}
                    >
                      {uploading[idx] ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
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
                            value={b.url}
                            onChange={(e) =>
                              updateButton(idx, j, {
                                ...b,
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
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  );
}
