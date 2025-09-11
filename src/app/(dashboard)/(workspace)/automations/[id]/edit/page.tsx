"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getAutomation,
  updateAutomation,
  deleteAutomation,
} from "@/actions/automations";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Automation } from "@/actions/automations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRecentInstagramPosts } from "@/actions/instagram";
import { PostPicker } from "@/components/automations/post-picker";

export default function EditAutomationPage() {
  const router = useRouter();
  const params = useParams();
  const automationId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [recentPosts, setRecentPosts] = useState<Array<{ id: string; caption?: string; media_url?: string; media_type?: string; thumbnail_url?: string }>>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    triggerWord: "",
    responseType: "fixed" as "fixed" | "ai_prompt",
    responseContent: "",
    isActive: true,
    hasExpiration: false,
    expiresAt: undefined as Date | undefined,
    triggerScope: "dm" as "dm" | "comment" | "both",
    postIdsRaw: "",
  });

  useEffect(() => {
    async function loadAutomation() {
      try {
        const data = await getAutomation(automationId);
        if (!data) {
          toast.error("Automation not found");
          router.push("/automations");
          return;
        }

        setAutomation(data);
        setFormData({
          title: data.title,
          description: data.description || "",
          triggerWord: data.triggerWord,
          responseType: data.responseType,
          responseContent: data.responseContent,
          isActive: data.isActive || false,
          hasExpiration: !!data.expiresAt,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
          triggerScope: (data as Automation).triggerScope || "dm",
          postIdsRaw: "", // will set from mapping if needed later
        });
        try {
          const posts = await getRecentInstagramPosts(6);
          setRecentPosts(posts);
        } catch {}
      } catch {
        toast.error("Failed to load automation");
        router.push("/automations");
      } finally {
        setIsLoading(false);
      }
    }

    loadAutomation();
  }, [automationId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateAutomation(automationId, {
        title: formData.title,
        description: formData.description || undefined,
        triggerWord: formData.triggerWord,
        responseType: formData.responseType,
        responseContent: formData.responseContent,
        isActive: formData.isActive,
        expiresAt: formData.hasExpiration ? formData.expiresAt : undefined,
        triggerScope: formData.triggerScope,
        postId: formData.triggerScope === "dm" ? undefined : formData.postIdsRaw.trim(),
      });

      toast.success("Automation updated successfully!");
      router.push("/automations");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update automation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAutomation(automationId);
      toast.success("Automation deleted successfully!");
      router.push("/automations");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete automation"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  type EditAutomationFormData = typeof formData;
  const handleInputChange = <K extends keyof EditAutomationFormData>(
    field: K,
    value: EditAutomationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div>Loading automation...</div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="flex items-center justify-center py-12">
        <div>Automation not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold">Edit Automation</h1>
            <p className="text-muted-foreground">
              Update your automation settings
            </p>
          </div>
        </div>
        <div className="flex flex-row gap-4 mt-auto">
          <Button onClick={() => router.back()} className="ml-auto mt-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete automation?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this automation? This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Give your automation a name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Welcome Bot, Price Inquiry"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Optional description of what this automation does"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trigger Configuration</CardTitle>
            <CardDescription>
              Set the trigger word and scope that will activate this automation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="triggerWord">Trigger Word *</Label>
              <Input
                id="triggerWord"
                value={formData.triggerWord}
                onChange={(e) =>
                  handleInputChange("triggerWord", e.target.value.toLowerCase())
                }
                placeholder="e.g., hello, price, help"
                required
              />
              <p className="text-sm text-muted-foreground">
                When a message matches this word, the automation will trigger.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Trigger Scope</Label>
              <Select
                value={formData.triggerScope}
                onValueChange={(v) =>
                  handleInputChange("triggerScope", v as "dm" | "comment" | "both")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dm">DM only</SelectItem>
                  <SelectItem value="comment">Comments only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose where this trigger applies. Comments use private replies.
              </p>
            </div>

            {formData.triggerScope !== "dm" && (
              <PostPicker
                value={formData.postIdsRaw}
                onChange={(v) => handleInputChange("postIdsRaw", v)}
                posts={recentPosts}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Type</CardTitle>
            <CardDescription>
              Choose how the automation should respond
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={formData.responseType}
              onValueChange={(value) =>
                handleInputChange(
                  "responseType",
                  value as "fixed" | "ai_prompt"
                )
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Fixed Message</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Send a predefined message every time
              </p>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ai_prompt" id="ai_prompt" />
                <Label htmlFor="ai_prompt">AI Prompt</Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Use AI to generate contextual responses based on your prompt
              </p>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Content</CardTitle>
            <CardDescription>
              {formData.responseType === "fixed"
                ? "Enter the message to send when triggered"
                : "Enter the prompt that will guide the AI response"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responseContent">
                {formData.responseType === "fixed" ? "Message" : "AI Prompt"} *
              </Label>
              <Textarea
                id="responseContent"
                value={formData.responseContent}
                onChange={(e) =>
                  handleInputChange("responseContent", e.target.value)
                }
                placeholder={
                  formData.responseType === "fixed"
                    ? "Thanks for your interest! How can I help you today?"
                    : "Help the user find their ideal gym routine. Ask about their fitness goals, experience level, and available time."
                }
                rows={4}
                required
              />
              {formData.responseType === "ai_prompt" && (
                <p className="text-sm text-muted-foreground">
                  The AI will use this prompt to generate contextual responses
                  based on the user&apos;s message
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Expiration</CardTitle>
            <CardDescription>
              Control when this automation is active and when it expires
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked === true)
                }
              />
              <Label htmlFor="isActive">Automation is active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasExpiration"
                checked={formData.hasExpiration}
                onCheckedChange={(checked) =>
                  handleInputChange("hasExpiration", checked === true)
                }
              />
              <Label htmlFor="hasExpiration">Set expiration date</Label>
            </div>

            {formData.hasExpiration && (
              <div className="space-y-2">
                <Label>Expiration Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expiresAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiresAt
                        ? format(formData.expiresAt, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.expiresAt}
                      onSelect={(date) => handleInputChange("expiresAt", date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Updating..." : "Update Automation"}
        </Button>
      </form>
    </div>
  );
}