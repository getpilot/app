"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ButtonConfig =
  | { type: "web_url"; title: string; url: string }
  | { type: "postback"; title: string; payload: string };

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
            ? e.buttons.map((b: any) =>
                b?.type === "web_url"
                  ? { type: "web_url", title: b?.title ?? "", url: b?.url ?? "" }
                  : { type: "postback", title: b?.title ?? "", payload: b?.payload ?? "" }
              )
            : [],
        }));
      }
    } catch {}
    return [];
  }, [value]);

  const [elements, setElements] = useState<ElementConfig[]>(parsedInitial);

  const payloadJson = useMemo(() => {
    const payload = elements.slice(0, 10).map((e) => ({
      title: e.title,
      subtitle: e.subtitle || undefined,
      image_url: e.image_url || undefined,
      default_action: e.default_action_url
        ? { type: "web_url" as const, url: e.default_action_url }
        : undefined,
      buttons: (e.buttons || []).slice(0, 3).map((b) =>
        b.type === "web_url"
          ? { type: "web_url" as const, url: b.url, title: b.title }
          : { type: "postback" as const, payload: b.payload, title: b.title }
      ),
    }));
    return JSON.stringify(payload);
  }, [elements]);

  useEffect(() => {
    if (payloadJson !== value) {
      onChange(payloadJson);
    }
    // intentionally not depending on onChange to avoid effect thrash when parent recreates handler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadJson, value]);

  const addElement = () => {
    setElements((prev) => [
      ...prev,
      { title: "", subtitle: "", image_url: "", default_action_url: "", buttons: [] },
    ]);
  };

  const removeElement = (idx: number) => {
    setElements((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateElement = (idx: number, patch: Partial<ElementConfig>) => {
    setElements((prev) => prev.map((el, i) => (i === idx ? { ...el, ...patch } : el)));
  };

  const addButton = (idx: number) => {
    setElements((prev) =>
      prev.map((el, i) =>
        i === idx ? { ...el, buttons: [...(el.buttons || []), { type: "web_url", title: "", url: "" }] } : el
      )
    );
  };

  const removeButton = (elIdx: number, btnIdx: number) => {
    setElements((prev) =>
      prev.map((el, i) => (i === elIdx ? { ...el, buttons: el.buttons.filter((_, j) => j !== btnIdx) } : el))
    );
  };

  const updateButton = (elIdx: number, btnIdx: number, next: ButtonConfig) => {
    setElements((prev) =>
      prev.map((el, i) =>
        i === elIdx
          ? { ...el, buttons: el.buttons.map((b, j) => (j === btnIdx ? next : b)) }
          : el
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">up to 10 elements, each with up to 3 buttons</div>
        <Button type="button" variant="outline" onClick={addElement}>
          Add Element
        </Button>
      </div>

      {elements.length === 0 && (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">no elements yet. click "Add Element" to start.</div>
      )}

      {elements.map((el, idx) => (
        <div key={idx} className="rounded-md border p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="font-medium">Element {idx + 1}</div>
            <Button type="button" variant="ghost" onClick={() => removeElement(idx)}>Remove</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>title *</Label>
              <Input value={el.title} onChange={(e) => updateElement(idx, { title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>subtitle</Label>
              <Input value={el.subtitle || ""} onChange={(e) => updateElement(idx, { subtitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>image url</Label>
              <Input value={el.image_url || ""} onChange={(e) => updateElement(idx, { image_url: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>default action url</Label>
              <Input
                value={el.default_action_url || ""}
                onChange={(e) => updateElement(idx, { default_action_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label>buttons</Label>
              <Button type="button" variant="outline" onClick={() => addButton(idx)} disabled={(el.buttons || []).length >= 3}>
                Add Button
              </Button>
            </div>
            {(el.buttons || []).length === 0 && (
              <div className="rounded border p-3 text-sm text-muted-foreground">no buttons. add up to 3.</div>
            )}
            <div className="space-y-3">
              {(el.buttons || []).map((b, j) => (
                <div key={j} className="rounded-md border p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Label className="block mb-1">type</Label>
                    <Select
                      value={b.type}
                      onValueChange={(v) =>
                        updateButton(
                          idx,
                          j,
                          v === "web_url"
                            ? { type: "web_url", title: b.title, url: (b as any).url || "" }
                            : { type: "postback", title: b.title, payload: (b as any).payload || "" }
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web_url">web_url</SelectItem>
                        <SelectItem value="postback">postback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label className="block mb-1">title</Label>
                    <Input value={b.title} onChange={(e) => updateButton(idx, j, { ...b, title: e.target.value } as ButtonConfig)} />
                  </div>
                  {b.type === "web_url" ? (
                    <div className="md:col-span-6">
                      <Label className="block mb-1">url</Label>
                      <Input value={(b as any).url || ""} onChange={(e) => updateButton(idx, j, { ...(b as any), url: e.target.value } as ButtonConfig)} />
                    </div>
                  ) : (
                    <div className="md:col-span-6">
                      <Label className="block mb-1">payload</Label>
                      <Input value={(b as any).payload || ""} onChange={(e) => updateButton(idx, j, { ...(b as any), payload: e.target.value } as ButtonConfig)} />
                    </div>
                  )}
                  <div className="md:col-span-1">
                    <Button type="button" variant="ghost" onClick={() => removeButton(idx, j)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


