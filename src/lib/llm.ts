import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");

// Use a free, capable model from HuggingFace that is confirmed to work on router
const LLM_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";

export type AnswerMode = "simple" | "exam" | "summary";

const SYSTEM_PROMPTS: Record<AnswerMode, string> = {
  simple: `You are an academic assistant for ABES Engineering College.
Answer the student's question using ONLY the provided context from their syllabus.
Explain concepts clearly as if teaching a first-year student. Use simple language and examples.
If the answer is not found in the context, respond with: "This topic was not found in your syllabus."
Do NOT make up information. Always base your answer on the provided context.`,

  exam: `You are an academic assistant for ABES Engineering College.
Answer the student's question using ONLY the provided context from their syllabus.
Format your answer in a structured, exam-ready format:
- Use clear headings and subheadings
- Include definitions, key points, and important formulas
- Write in a formal academic tone suitable for exam answers
- Organize content logically with numbered points
If the answer is not found in the context, respond with: "This topic was not found in your syllabus."
Do NOT make up information.`,

  summary: `You are an academic assistant for ABES Engineering College.
Answer the student's question using ONLY the provided context from their syllabus.
Provide a concise summary with:
- Maximum 5 key bullet points
- Each point should be one clear sentence
- Highlight the most important concepts
- Include any critical formulas or definitions
If the answer is not found in the context, respond with: "This topic was not found in your syllabus."
Do NOT make up information.`,
};

/**
 * Call the LLM to generate an answer.
 */
export async function generateAnswer(
  question: string,
  contextChunks: string[],
  mode: AnswerMode = "simple"
): Promise<string> {
  const context = contextChunks.join("\n\n---\n\n");

  const systemContent = SYSTEM_PROMPTS[mode];
  const userContent = `--- SYLLABUS CONTEXT ---\n${context}\n--- END CONTEXT ---\n\nStudent's Question: ${question}`;

  try {
    const response = await hf.chatCompletion({
      model: LLM_MODEL,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      max_tokens: 800,
      temperature: 0.3,
      top_p: 0.9,
    });

    return response.choices[0].message.content || "No answer generated.";
  } catch (error: any) {
    console.error("Primary LLM failed:", error.message);

    // Fallback to a backup model if primary fails
    try {
      console.log("Attempting fallback to Zephyr...");
      const fallbackResponse = await hf.chatCompletion({
        model: "HuggingFaceH4/zephyr-7b-beta",
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });
      return fallbackResponse.choices[0].message.content || "No answer generated.";
    } catch (fallbackError: any) {
      console.error("Fallback LLM also failed:", fallbackError.message);
      return "I'm sorry, the AI service is temporarily unavailable. Please try again in a moment.";
    }
  }
}
