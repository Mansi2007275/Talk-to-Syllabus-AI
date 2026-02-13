"use client";

import { cn } from "@/lib/utils";
import { Bot, User, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { SourceAccordion } from "./source-accordion";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  cached?: boolean;
  responseTime?: number;
}

interface ChatBubbleProps {
  message: Message;
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 max-w-[85%]",
        isUser ? "ml-auto flex-row-reverse" : ""
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-primary/20" : "bg-accent"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-accent-foreground" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-card border border-border rounded-tl-sm"
        )}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Metadata for assistant messages */}
        {!isUser && (message.cached || message.responseTime) && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
            {message.cached && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Zap className="w-3 h-3" /> Cached
              </span>
            )}
            {message.responseTime && (
              <span className="text-xs text-muted-foreground">
                {message.responseTime}ms
              </span>
            )}
          </div>
        )}

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3">
            <SourceAccordion sources={message.sources} />
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 max-w-[85%]">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
        <Bot className="w-4 h-4 text-accent-foreground" />
      </div>
      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
