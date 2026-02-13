"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { CourseSelector } from "@/components/course-selector";
import { ChatInterface } from "@/components/chat-interface";
import { Footer } from "@/components/footer";

export default function Home() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Talk to Your Syllabus
          </h1>
          <p className="text-muted-foreground">
            Select a course and ask any question - get instant, AI-powered
            answers from your syllabus.
          </p>
        </div>

        <CourseSelector
          selectedCourse={selectedCourse}
          onSelect={setSelectedCourse}
        />

        <ChatInterface selectedCourse={selectedCourse} />
      </main>
      <Footer />
    </div>
  );
}
