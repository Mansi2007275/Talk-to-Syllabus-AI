import SHA256 from "crypto-js/sha256";
import { getServiceSupabase } from "./supabase";

interface CacheEntry {
  answer: string;
  sources: string[];
}

/**
 * Generate a deterministic hash for a question + course + mode combination.
 */
export function hashQuestion(
  question: string,
  course: string,
  mode: string
): string {
  const normalized = `${question.toLowerCase().trim()}|${course.toLowerCase().trim()}|${mode}`;
  return SHA256(normalized).toString();
}

/**
 * Look up a cached answer for the given question hash.
 * Returns null if not found.
 */
export async function getCachedAnswer(
  questionHash: string
): Promise<CacheEntry | null> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("query_cache")
    .select("answer, sources, hit_count")
    .eq("question_hash", questionHash)
    .single();

  if (error || !data) return null;

  // Increment hit count
  await supabase
    .from("query_cache")
    .update({
      hit_count: (data.hit_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("question_hash", questionHash);

  return {
    answer: data.answer,
    sources: data.sources || [],
  };
}

/**
 * Store an answer in the cache.
 */
export async function cacheAnswer(
  questionHash: string,
  question: string,
  course: string,
  mode: string,
  answer: string,
  sources: string[]
): Promise<void> {
  const supabase = getServiceSupabase();

  await supabase.from("query_cache").upsert(
    {
      question_hash: questionHash,
      question,
      course_name: course,
      mode,
      answer,
      sources,
      hit_count: 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "question_hash" }
  );
}
