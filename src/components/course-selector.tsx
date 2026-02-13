"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";

interface CourseSelectorProps {
  selectedCourse: string;
  onSelect: (course: string) => void;
}

export function CourseSelector({ selectedCourse, onSelect }: CourseSelectorProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const res = await fetch("/api/courses");
      const json = await res.json();
      return json.courses as string[];
    },
  });

  const courses = data || [];

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-muted-foreground mb-2">
        Select Course
      </label>
      <div className="relative">
        <select
          value={selectedCourse}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none px-4 py-3 pr-10 rounded-lg
                     bg-secondary border border-border text-foreground
                     focus:outline-none focus:ring-2 focus:ring-primary/50
                     cursor-pointer"
        >
          <option value="">
            {isLoading ? "Loading courses..." : "Choose a course..."}
          </option>
          {courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
      {courses.length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground mt-2">
          No courses available yet. Upload a syllabus from the Admin page.
        </p>
      )}
    </div>
  );
}
