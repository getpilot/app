"use client";

import { Fragment, useEffect, useEffectEvent, useRef, useState, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import axios from "axios";
import { Bot } from "lucide-react";

import { getCurrentBillingStatusAction } from "@/actions/billing";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Response } from "@/components/ai-elements/response";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { AI_TOOLS, type ToolInfo } from "@/lib/constants/ai-tools";

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

interface ActionLog {
  id: string;
  action: "sent_reply";
  result: "sent" | "failed";
  recipientUsername: string;
  text: string;
  createdAt: string;
  messageId?: string;
}

interface Contact {
  id: string;
  username?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  stage: "new" | "lead" | "follow-up" | "ghosted";
  sentiment: "hot" | "warm" | "cold" | "ghosted" | "neutral";
  leadScore?: number;
  nextAction?: string;
  leadValue?: number;
  triggerMatched: boolean;
  followupNeeded: boolean;
  followupMessage?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactTag {
  id: string;
  tag: string;
  createdAt: string;
}

interface MemoryResult {
  id: string;
  similarity: number;
  memory?: string;
  chunk?: string;
}

interface ToolOutputData {
  success: boolean;
  error?: string;
  profile?: UserProfile;
  offers?: Offer[];
  links?: OfferLink[];
  toneProfile?: ToneProfile;
  faqs?: FAQ[];
  logs?: ActionLog[];
  log?: ActionLog;
  faqId?: string;
  offerId?: string;
  linkId?: string;
  contacts?: Contact[];
  contact?: Contact;
  tags?: ContactTag[];
  results?: MemoryResult[];
}

function renderToolOutput(
  toolName: string,
  output: ToolOutputData | undefined,
  toolInfo?: ToolInfo,
) {
  if (!output || !output.success) {
    return `Error: ${output?.error || "Unknown error occurred"}`;
  }

  switch (toolName) {
    case "getUserProfile": {
      if (!output.profile) {
        return "**User profile not found**";
      }

      const profile = output.profile;
      return `**User Profile**
**Name:** ${profile.name}
**Email:** ${profile.email}
**Gender:** ${profile.gender || "Not specified"}
**Use Cases:** ${profile.use_case?.join(", ") || "Not specified"}
**Business Type:** ${profile.business_type || "Not specified"}
**Main Offering:** ${profile.main_offering || "Not specified"}`;
    }

    case "listUserOffers": {
      const offers = output.offers || [];
      if (offers.length === 0) {
        return "**No offers found**";
      }

      return `**User Offers (${offers.length})**
${offers
  .map(
    (offer, index) =>
      `${index + 1}. **${offer.name}**${offer.value ? ` - $${offer.value}` : ""}
   ${offer.content}`,
  )
  .join("\n\n")}`;
    }

    case "listUserOfferLinks": {
      const links = output.links || [];
      if (links.length === 0) {
        return "**No offer links found**";
      }

      return `**Offer Links (${links.length})**
${links
  .map((link, index) => `${index + 1}. **${link.type}**: ${link.url}`)
  .join("\n")}`;
    }

    case "getToneProfile": {
      if (!output.toneProfile) {
        return "**No tone profile found**";
      }

      const toneProfile = output.toneProfile;
      return `**Tone Profile**
**Type:** ${toneProfile.toneType}
**Sample Texts:** ${toneProfile.sampleText?.length || 0} samples
**Sample Files:** ${toneProfile.sampleFiles?.length || 0} files
${
  toneProfile.trainedEmbeddingId
    ? `**Trained Embedding:** ${toneProfile.trainedEmbeddingId}`
    : ""
}`;
    }

    case "listFaqs": {
      const faqs = output.faqs || [];
      if (faqs.length === 0) {
        return "**No FAQs found**";
      }

      return `**FAQs (${faqs.length})**
${faqs
  .map(
    (faq, index) =>
      `${index + 1}. **Q:** ${faq.question}
   **A:** ${faq.answer || "No answer provided"}`,
  )
  .join("\n\n")}`;
    }

    case "searchBusinessMemory":
    case "searchContactMemory": {
      const results = output.results || [];
      if (results.length === 0) {
        return "**No matching memories found**";
      }

      return `**Memory Results (${results.length})**
${results
  .map(
    (result, index) =>
      `${index + 1}. ${result.memory || result.chunk || "No memory content available"}
   **Similarity:** ${result.similarity.toFixed(2)}`,
  )
  .join("\n\n")}`;
    }

    case "listActionLogs": {
      const logs = output.logs || [];
      if (logs.length === 0) {
        return "**No action logs found**";
      }

      return `**Recent Action Logs (${logs.length})**
${logs
  .map(
    (log, index) =>
      `${index + 1}. **${log.action}** - ${log.result}
   **Recipient:** ${log.recipientUsername}
   **Text:** ${
     log.text
       ? `${log.text.substring(0, 100)}${log.text.length > 100 ? "..." : ""}`
       : "N/A"
   }
   **Date:** ${new Date(log.createdAt).toLocaleString()}`,
  )
  .join("\n\n")}`;
    }

    case "getActionLog": {
      if (!output.log) {
        return "**Action log not found**";
      }

      const log = output.log;
      return `**Action Log Details**
**Action:** ${log.action}
**Result:** ${log.result}
**Recipient:** ${log.recipientUsername}
**Text:** ${log.text}
**Date:** ${new Date(log.createdAt).toLocaleString()}
**Message ID:** ${log.messageId || "N/A"}`;
    }

    case "listContacts": {
      const contacts = output.contacts || [];
      if (contacts.length === 0) {
        return "**No contacts found**";
      }

      return `**Contacts (${contacts.length})**
${contacts
  .map(
    (contact, index) =>
      `${index + 1}. **${contact.username || "Unknown"}** (${contact.stage})
   **Sentiment:** ${contact.sentiment}${
     contact.leadScore ? ` | **Score:** ${contact.leadScore}` : ""
   }
   **Last Message:** ${
     contact.lastMessage
       ? `${contact.lastMessage.substring(0, 100)}${
           contact.lastMessage.length > 100 ? "..." : ""
         }`
       : "None"
   }
   **Created:** ${new Date(contact.createdAt).toLocaleDateString()}`,
  )
  .join("\n\n")}`;
    }

    case "getContact": {
      if (!output.contact) {
        return "**Contact not found**";
      }

      const contact = output.contact;
      return `**Contact Details**
**Username:** ${contact.username || "Unknown"}
**Stage:** ${contact.stage}
**Sentiment:** ${contact.sentiment}
**Lead Score:** ${contact.leadScore || "Not set"}
**Lead Value:** ${contact.leadValue ? `$${contact.leadValue}` : "Not set"}
**Next Action:** ${contact.nextAction || "Not set"}
**Trigger Matched:** ${contact.triggerMatched ? "Yes" : "No"}
**Follow-up Needed:** ${contact.followupNeeded ? "Yes" : "No"}
**Last Message:** ${contact.lastMessage || "None"}
**Last Message At:** ${
        contact.lastMessageAt
          ? new Date(contact.lastMessageAt).toLocaleString()
          : "Never"
      }
**Notes:** ${contact.notes || "None"}
**Created:** ${new Date(contact.createdAt).toLocaleString()}
**Updated:** ${new Date(contact.updatedAt).toLocaleString()}`;
    }

    case "getContactTags": {
      const tags = output.tags || [];
      if (tags.length === 0) {
        return "**No tags found for this contact**";
      }

      return `**Contact Tags (${tags.length})**
${tags.map((tag, index) => `${index + 1}. ${tag.tag}`).join("\n")}`;
    }

    case "searchContacts": {
      const contacts = output.contacts || [];
      if (contacts.length === 0) {
        return "**No contacts found matching your search**";
      }

      return `**Search Results (${contacts.length})**
${contacts
  .map(
    (contact, index) =>
      `${index + 1}. **${contact.username || "Unknown"}** (${contact.stage})
   **Sentiment:** ${contact.sentiment}${
     contact.leadScore ? ` | **Score:** ${contact.leadScore}` : ""
   }
   **Notes:** ${
     contact.notes
       ? `${contact.notes.substring(0, 100)}${
           contact.notes.length > 100 ? "..." : ""
         }`
       : "None"
   }`,
  )
  .join("\n\n")}`;
    }

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
    case "updateContact":
    case "addContactTag":
    case "removeContactTag":
      return `**${toolInfo?.displayName || toolName}** completed successfully`;

    default:
      return `**${toolInfo?.displayName || toolName}** completed successfully`;
  }
}

interface SidekickChatbotProps {
  sessionId?: string;
  initialMessages?: UIMessage[];
  onSessionCreated?: (sessionId: string) => void;
}

export function SidekickChatbot({
  sessionId,
  initialMessages,
  onSessionCreated,
}: SidekickChatbotProps) {
  const [input, setInput] = useState("");
  const [createdSessionId, setCreatedSessionId] = useState<string | undefined>();
  const [billingBlockedMessage, setBillingBlockedMessage] = useState<string | null>(null);
  const pendingMessageRef = useRef<string | null>(null);

  const activeSessionId = sessionId ?? createdSessionId;

  const { messages, sendMessage, status } = useChat({
    id: activeSessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        return { body: { message: messages[messages.length - 1], id } };
      },
    }),
  });

  useEffect(() => {
    const pendingMessage = pendingMessageRef.current;
    if (!activeSessionId || !pendingMessage) {
      return;
    }

    pendingMessageRef.current = null;
    sendMessage({ text: pendingMessage });
  }, [activeSessionId, sendMessage]);

  const refreshBillingStatus = useEffectEvent(async () => {
    try {
      const billingStatus = await getCurrentBillingStatusAction();

      if (!billingStatus) {
        return true;
      }

      if (billingStatus.flags.isStructurallyFrozen) {
        setBillingBlockedMessage(
          "Your workspace is frozen because it is above the current plan cap. Existing data is still visible, but Sidekick chat is disabled until you upgrade or reduce usage.",
        );
        return false;
      }

      if (!billingStatus.flags.canUseSidekickChat) {
        setBillingBlockedMessage(
          "You have reached the monthly Sidekick chat limit for your current plan.",
        );
        return false;
      }

      setBillingBlockedMessage(null);
      return true;
    } catch (error) {
      console.error("Failed to load billing status:", error);
      return true;
    }
  });

  useEffect(() => {
    void refreshBillingStatus();
  }, [refreshBillingStatus]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const canSubmit = await refreshBillingStatus();
    if (!canSubmit || !input.trim()) {
      return;
    }

    if (!activeSessionId) {
      const messageText = input;
      setInput("");

      let newSessionId: string;
      try {
        const response = await axios.post("/api/chat/sessions", {
          title: "New Chat",
        });
        newSessionId = response.data.id;
      } catch (error) {
        console.error("Failed to create session:", error);
        setInput(messageText);
        return;
      }

      pendingMessageRef.current = messageText;
      setCreatedSessionId(newSessionId);
      if (onSessionCreated) {
        onSessionCreated(newSessionId);
      }

      return;
    }

    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="p-4">
          {messages.length === 0 && (
            <div className="flex h-[calc(100vh-250px)] items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Bot className="mx-auto mb-4 size-14 opacity-50" />
                <h3 className="font-heading text-xl text-foreground">
                  Hey! I&apos;m your Sidekick.
                </h3>
                <p className="mx-auto mt-2 max-w-md text-balance text-base">
                  Ask about leads, offers, FAQs, contacts, or draft replies. I can
                  also search your synced business and DM memory.
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id}>
              {message.parts.map((part, index) => {
                if (part.type === "text") {
                  return (
                    <Fragment key={`${message.id}-text-${index}`}>
                      <Message from={message.role}>
                        <MessageContent>
                          <Response>{part.text}</Response>
                        </MessageContent>
                      </Message>
                    </Fragment>
                  );
                }

                if (!part.type.startsWith("tool-")) {
                  return null;
                }

                const toolName = part.type.replace("tool-", "");
                const toolInfo = AI_TOOLS.find((toolEntry) => toolEntry.name === toolName);

                if (
                  !("state" in part) ||
                  !("input" in part) ||
                  !("output" in part) ||
                  !("errorText" in part)
                ) {
                  return null;
                }

                return (
                  <Fragment key={`${message.id}-tool-${toolName}-${index}`}>
                    <Tool defaultOpen={part.state === "output-available"}>
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
                                  part.output as ToolOutputData,
                                  toolInfo,
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
              })}
            </div>
          ))}

          {status === "submitted" && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-4">
        {billingBlockedMessage && (
          <p className="mb-3 text-sm text-muted-foreground">
            {billingBlockedMessage}
          </p>
        )}
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            onChange={(event) => setInput(event.target.value)}
            value={input}
            disabled={Boolean(billingBlockedMessage)}
          />
          <PromptInputSubmit
            className="float-right m-2"
            disabled={!input || Boolean(billingBlockedMessage)}
            status={status}
          />
        </PromptInput>
      </div>
    </div>
  );
}
