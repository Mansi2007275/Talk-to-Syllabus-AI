import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { generateAnswer, type AnswerMode } from "@/lib/llm";
import { hashQuestion, getCachedAnswer, cacheAnswer } from "@/lib/cache";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 30; // 30 seconds max for Vercel Hobby

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { question, course, mode = "simple" } = body;

    // Validate input
    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!course || typeof course !== "string") {
      return NextResponse.json(
        { error: "Course selection is required" },
        { status: 400 }
      );
    }

    const validModes: AnswerMode[] = ["simple", "exam", "summary"];
    if (!validModes.includes(mode as AnswerMode)) {
      return NextResponse.json(
        { error: "Invalid mode. Use: simple, exam, or summary" },
        { status: 400 }
      );
    }

    // Step 1: Check cache
    const qHash = hashQuestion(question, course, mode);
    const cached = await getCachedAnswer(qHash);

    if (cached) {
      // Log analytics
      await logAnalytics(course, question, mode, true, Date.now() - startTime);

      return NextResponse.json({
        answer: cached.answer,
        sources: cached.sources,
        cached: true,
        responseTime: Date.now() - startTime,
      });
    }

    // Step 2: Generate embedding for the question
    const queryEmbedding = await generateEmbedding(question);

    // Step 3: Vector similarity search
    const supabase = getServiceSupabase();
    const { data: matches, error: matchError } = await supabase.rpc(
      "match_chunks",
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_count: 5,
        filter_course: course,
      }
    );

    if (matchError) {
      console.error("Vector search error:", matchError);
      return NextResponse.json(
        { error: "Failed to search syllabus content" },
        { status: 500 }
      );
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        answer:
          "No relevant content found in the syllabus for this course. Please make sure the syllabus has been uploaded.",
        sources: [],
        cached: false,
        responseTime: Date.now() - startTime,
      });
    }

    // Step 4: Extract context chunks
    const contextChunks = matches.map(
      (m: any) => m.content
    );
    const sources = matches.map(
      (m: any) =>
        `[Chunk ${m.chunk_index + 1}] (similarity: ${(m.similarity * 100).toFixed(1)}%) ${m.content.substring(0, 100)}...`
    );

    // Step 5: Generate answer via LLM
    const answer = await generateAnswer(
      question,
      contextChunks,
      mode as AnswerMode
    );

    // Step 6: Cache the result
    await cacheAnswer(qHash, question, course, mode, answer, sources);

    // Step 7: Log analytics
    await logAnalytics(course, question, mode, false, Date.now() - startTime);

    return NextResponse.json({
      answer,
      sources,
      cached: false,
      responseTime: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error("Query API error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}

async function logAnalytics(
  course: string,
  question: string,
  mode: string,
  cached: boolean,
  responseTimeMs: number
) {
  try {
    const supabase = getServiceSupabase();
    await supabase.from("analytics").insert({
      course_name: course,
      question,
      mode,
      cached,
      response_time_ms: responseTimeMs,
    });
  } catch (err) {
    // Non-critical - don't fail the request
    console.error("Analytics logging failed:", err);
  }
}
