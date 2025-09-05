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
                <p className="text-foreground text-lg">Hi! I&apos;m your Sidekick.</p>
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
          <PromptInputSubmit className="m-2 float-right" disabled={!input} status={status} />
        </PromptInput>
      </div>
    </div>
  );
}