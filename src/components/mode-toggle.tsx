"use client";

import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, List } from "lucide-react";

export type AnswerMode = "simple" | "exam" | "summary";

interface ModeToggleProps {
  mode: AnswerMode;
  onChange: (mode: AnswerMode) => void;
}

const modes: { value: AnswerMode; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "simple",
    label: "Simple",
    icon: <BookOpen className="w-4 h-4" />,
    description: "Easy explanation",
  },
  {
    value: "exam",
    label: "Exam",
    icon: <GraduationCap className="w-4 h-4" />,
    description: "Exam-ready format",
  },
  {
    value: "summary",
    label: "Summary",
    icon: <List className="w-4 h-4" />,
    description: "Key bullet points",
  },
];

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex gap-2">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
            mode === m.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          )}
          title={m.description}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}
