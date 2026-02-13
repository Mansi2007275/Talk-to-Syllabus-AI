"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, AlertCircle } from "lucide-react";
import { ChatBubble, TypingIndicator, type Message } from "./chat-bubble";
import { ModeToggle, type AnswerMode } from "./mode-toggle";

interface ChatInterfaceProps {
  selectedCourse: string;
}

export function ChatInterface({ selectedCourse }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AnswerMode>("simple");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    if (!selectedCourse) {
      setError("Please select a course first.");
      return;
    }

    setError(null);
    setInput("");

    // Add user message (optimistic)
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          course: selectedCourse,
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        sources: data.sources,
        cached: data.cached,
        responseTime: data.responseTime,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${err.message}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedCourse, mode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(sendMessage, 150);
    }
  };

  return (
    <div className="flex-1 flex flex-col rounded-xl border border-border bg-card/30 overflow-hidden">
      {/* Mode Toggle */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Answer Mode</span>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px] max-h-[60vh]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Send className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-1">Ask anything about your syllabus</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Select a course above and type your question. I&apos;ll find the most
              relevant answer from your syllabus.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {[
                "What are the topics in Unit 3?",
                "Explain binary search tree",
                "Important formulas for OS",
                "Summarize process scheduling",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border
                           text-muted-foreground hover:text-foreground hover:bg-secondary
                           transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/30 border border-red-800 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedCourse
                ? `Ask about ${selectedCourse}...`
                : "Select a course first..."
            }
            disabled={!selectedCourse}
            rows={1}
            className="flex-1 resize-none px-4 py-3 rounded-lg bg-secondary border border-border
                       text-foreground placeholder:text-muted-foreground
                       focus:outline-none focus:ring-2 focus:ring-primary/50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       max-h-32"
            style={{ minHeight: "48px" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || !selectedCourse}
            className="flex-shrink-0 p-3 rounded-lg bg-primary text-primary-foreground
                       hover:bg-primary/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send - Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
