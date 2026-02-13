import Link from "next/link";
import { BookOpen, Settings } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">
            Talk to Syllabus{" "}
            <span className="text-primary">AI</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Chat
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
