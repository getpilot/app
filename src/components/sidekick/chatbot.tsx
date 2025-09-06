"use client";

import { useState, Fragment } from "react";
import { useChat } from "@ai-sdk/react";
import { Bot } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import { Loader } from "@/components/ai-elements/loader";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { AI_TOOLS, ToolInfo } from "@/lib/constants/ai-tools";

interface UserProfile {
  name: string;
  email: string;
  gender?: string;
  use_case?: string[];
  business_type?: string;
  main_offering?: string;
}

interface Offer {
  id: string;
  name: string;
  content: string;
  value?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface OfferLink {
  id: string;
  type: "primary" | "calendar" | "notion" | "website";
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ToneProfile {
  toneType: "friendly" | "direct" | "like_me" | "custom";
  sampleText?: string[];
  sampleFiles?: string[];
  trainedEmbeddingId?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer?: string;
  createdAt: Date;
}

interface SidekickSettings {
  systemPrompt: string;
}

interface ActionLog {
  id: string;
  action: "sent_reply" | "follow_up_sent";
  result: "sent" | "failed";
  recipientUsername: string;
  text: string;
  createdAt: string;
  messageId?: string;
}

interface ToolOutput {
  success: boolean;
  error?: string;
  profile?: UserProfile;
  offers?: Offer[];
  links?: OfferLink[];
  toneProfile?: ToneProfile;
  faqs?: FAQ[];
  settings?: SidekickSettings;
  logs?: ActionLog[];
  log?: ActionLog;
  faqId?: string;
  offerId?: string;
  linkId?: string;
}

function renderToolOutput(
  toolName: string,
  output: ToolOutput | undefined,
  toolInfo?: ToolInfo
): string {
  if (!output || !output.success) {
    return `❌ **Error**: ${output?.error || "Unknown error occurred"}`;
  }

  switch (toolName) {
    case "getUserProfile":
      const profile = output.profile;
      if (!profile) {
        return "**👤 User Profile not found**";
      }
      return `**👤 User Profile**
**Name:** ${profile.name}
**Email:** ${profile.email}
**Gender:** ${profile.gender || "Not specified"}
**Use Cases:** ${profile.use_case?.join(", ") || "Not specified"}
**Business Type:** ${profile.business_type || "Not specified"}
**Main Offering:** ${profile.main_offering || "Not specified"}`;

    case "listUserOffers":
      const offers = output.offers || [];
      if (offers.length === 0) {
        return "**📦 No offers found**";
      }
      return `**📦 User Offers (${offers.length})**
${offers
  .map(
    (offer, index: number) =>
      `${index + 1}. **${offer.name}**${offer.value ? ` - $${offer.value}` : ""}
   ${offer.content}`
  )
  .join("\n\n")}`;

    case "listUserOfferLinks":
      const links = output.links || [];
      if (links.length === 0) {
        return "**🔗 No offer links found**";
      }
      return `**🔗 Offer Links (${links.length})**
${links
  .map((link, index: number) => `${index + 1}. **${link.type}**: ${link.url}`)
  .join("\n")}`;

    case "getToneProfile":
      const toneProfile = output.toneProfile;
      if (!toneProfile) {
        return "**🎭 No tone profile found**";
      }
      return `**🎭 Tone Profile**
**Type:** ${toneProfile.toneType}
**Sample Texts:** ${toneProfile.sampleText?.length || 0} samples
**Sample Files:** ${toneProfile.sampleFiles?.length || 0} files
${
  toneProfile.trainedEmbeddingId
    ? `**Trained Embedding:** ${toneProfile.trainedEmbeddingId}`
    : ""
}`;

    case "listFaqs":
      const faqs = output.faqs || [];
      if (faqs.length === 0) {
        return "**❓ No FAQs found**";
      }
      return `**❓ FAQs (${faqs.length})**
${faqs
  .map(
    (faq, index: number) =>
      `${index + 1}. **Q:** ${faq.question}
   **A:** ${faq.answer || "No answer provided"}`
  )
  .join("\n\n")}`;

    case "getSidekickSettings":
      const settings = output.settings;
      if (!settings) {
        return "**⚙️ No sidekick settings found**";
      }
      return `**⚙️ Sidekick Settings**
**System Prompt:** ${settings.systemPrompt}`;

    case "listActionLogs":
      const logs = output.logs || [];
      if (logs.length === 0) {
        return "**📋 No action logs found**";
      }
      return `**📋 Recent Action Logs (${logs.length})**
${logs
  .map(
    (log, index: number) =>
      `${index + 1}. **${log.action}** - ${log.result}
   **Recipient:** ${log.recipientUsername}
   **Text:** ${
     log.text
       ? `${log.text.substring(0, 100)}${log.text.length > 100 ? "..." : ""}`
       : "N/A"
   }   **Date:** ${new Date(log.createdAt).toLocaleString()}`
  )
  .join("\n\n")}`;

    case "getActionLog":
      const log = output.log;
      if (!log) {
        return "**📋 Action log not found**";
      }
      return `**📋 Action Log Details**
**Action:** ${log.action}
**Result:** ${log.result}
**Recipient:** ${log.recipientUsername}
**Text:** ${log.text}
**Date:** ${new Date(log.createdAt).toLocaleString()}
**Message ID:** ${log.messageId || "N/A"}`;

    // Success messages for actions
    case "updateUserProfile":
    case "createUserOffer":
    case "updateUserOffer":
    case "deleteUserOffer":
    case "addUserOfferLink":
    case "updateToneProfile":
    case "addToneSample":
    case "addFaq":
    case "updateFaq":
    case "deleteFaq":
    case "updateSidekickSettings":
      return `✅ **${
        toolInfo?.displayName || toolName
      }** completed successfully`;

    default:
      return `✅ **${
        toolInfo?.displayName || toolName
      }** completed successfully`;
  }
}

export function SidekickChatbot() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Conversation className="flex-1">
        <ConversationContent className="p-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-[calc(100vh-250px)]">
              <div className="text-center text-muted-foreground">
                <Bot className="mx-auto size-14 mb-4 opacity-50" />
                <p className="text-foreground text-lg">
                  Hi! I&apos;m your Sidekick.
                </p>
                <p className="text-base">
                  Ask me anything about your settings or data.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id}>
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case "text":
                    return (
                      <Fragment key={`${message.id}-${i}`}>
                        <Message from={message.role}>
                          <MessageContent>
                            <Response>{part.text}</Response>
                          </MessageContent>
                        </Message>
                      </Fragment>
                    );
                  default:
                    // handle all AI tools generically
                    if (part.type.startsWith("tool-")) {
                      const toolName = part.type.replace("tool-", "");
                      const toolInfo = AI_TOOLS.find(
                        (tool) => tool.name === toolName
                      );

                      if (
                        "state" in part &&
                        "input" in part &&
                        "output" in part &&
                        "errorText" in part
                      ) {
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Tool
                              defaultOpen={part.state === "output-available"}
                            >
                              <ToolHeader
                                type={part.type as `tool-${string}`}
                                state={part.state}
                              />
                              <ToolContent>
                                <ToolInput input={part.input} />
                                <ToolOutput
                                  output={
                                    part.output ? (
                                      <Response>
                                        {renderToolOutput(
                                          toolName,
                                          part.output as ToolOutput,
                                          toolInfo
                                        )}
                                      </Response>
                                    ) : undefined
                                  }
                                  errorText={part.errorText}
                                />
                              </ToolContent>
                            </Tool>
                          </Fragment>
                        );
                      }
                    }
                    return null;
                }
              })}
            </div>
          ))}

          {status === "submitted" && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          <PromptInputSubmit
            className="m-2 float-right"
            disabled={!input}
            status={status}
          />
        </PromptInput>
      </div>
    </div>
  );
}