"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAutomation } from "@/actions/automations";
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
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NewAutomationFormData = {
  title: string;
  description: string;
  triggerWord: string;
  responseType: "fixed" | "ai_prompt";
  responseContent: string;
  hasExpiration: boolean;
  expiresAt: Date | undefined;
};

export default function NewAutomationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<NewAutomationFormData>({
    title: "",
    description: "",
    triggerWord: "",
    responseType: "fixed",
    responseContent: "",
    hasExpiration: false,
    expiresAt: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createAutomation({
        title: formData.title,
        description: formData.description || undefined,
        triggerWord: formData.triggerWord,
        responseType: formData.responseType,
        responseContent: formData.responseContent,
        expiresAt: formData.hasExpiration ? formData.expiresAt : undefined,
      });

      toast.success("Automation created successfully!");
      router.push("/automations");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create automation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = <K extends keyof NewAutomationFormData>(
    field: K,
    value: NewAutomationFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-3xl font-bold">Create New Automation</h1>
          <p className="text-muted-foreground">
            Set up an automated response for Instagram DMs
          </p>
        </div>
        <Button onClick={() => router.back()} className="ml-auto mt-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
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
              Set the trigger word that will activate this automation
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
                When someone sends a DM containing this word, the automation
                will trigger
              </p>
            </div>
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
                handleInputChange("responseType", value)
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
            <CardTitle>Expiration (Optional)</CardTitle>
            <CardDescription>
              Set when this automation should automatically disable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasExpiration"
                checked={formData.hasExpiration}
                onCheckedChange={(checked) =>
                  handleInputChange("hasExpiration", checked)
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
          {isSubmitting ? "Creating..." : "Create Automation"}
        </Button>
      </form>
    </div>
  );
}