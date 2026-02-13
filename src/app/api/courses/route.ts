import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("documents")
      .select("course_name")
      .eq("status", "completed")
      .order("course_name");

    if (error) {
      console.error("Courses fetch error:", error);
      return NextResponse.json({ courses: [] });
    }

    // Deduplicate course names
    const courseSet = new Set<string>(data?.map((d: any) => d.course_name) || []);
    const courses = Array.from(courseSet);

    return NextResponse.json({ courses });
  } catch (err) {
    console.error("Courses API error:", err);
    return NextResponse.json({ courses: [] });
  }
}
