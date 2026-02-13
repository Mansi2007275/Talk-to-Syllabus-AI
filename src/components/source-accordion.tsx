"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

interface SourceAccordionProps {
  sources: string[];
}

export function SourceAccordion({ sources }: SourceAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs
                   text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          {sources.length} source{sources.length !== 1 ? "s" : ""} referenced
        </span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          {sources.map((source, idx) => (
            <div
              key={idx}
              className="text-xs text-muted-foreground bg-background/50
                         rounded p-2 border border-border/30"
            >
              {source}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
