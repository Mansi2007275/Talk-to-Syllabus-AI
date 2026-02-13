import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");

// Use a free, capable model from HuggingFace
const LLM_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";

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
 * Build the full prompt with context and question.
 */
function buildPrompt(
  question: string,
  context: string,
  mode: AnswerMode
): string {
  return `${SYSTEM_PROMPTS[mode]}

--- SYLLABUS CONTEXT ---
${context}
--- END CONTEXT ---

Student's Question: ${question}

Answer:`;
}

/**
 * Call the LLM to generate an answer.
 */
export async function generateAnswer(
  question: string,
  contextChunks: string[],
  mode: AnswerMode = "simple"
): Promise<string> {
  const context = contextChunks.join("\n\n---\n\n");
  const prompt = buildPrompt(question, context, mode);

  try {
    const response = await hf.textGeneration({
      model: LLM_MODEL,
      inputs: prompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.3,
        top_p: 0.9,
        repetition_penalty: 1.1,
        return_full_text: false,
      },
    });

    return response.generated_text.trim();
  } catch (error: any) {
    // Fallback: try a smaller model if the primary is unavailable
    console.error("Primary LLM failed, trying fallback:", error.message);

    try {
      const fallbackResponse = await hf.textGeneration({
        model: "microsoft/DialoGPT-large",
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.3,
          return_full_text: false,
        },
      });
      return fallbackResponse.generated_text.trim();
    } catch (fallbackError: any) {
      console.error("Fallback LLM also failed:", fallbackError.message);
      return "I'm sorry, the AI service is temporarily unavailable. Please try again in a moment.";
    }
  }
}
