import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");

const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

/**
 * Generate embedding for a single text using HuggingFace Inference API.
 * Returns a 384-dimensional vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n/g, " ").trim();

  const response = await hf.featureExtraction({
    model: EMBEDDING_MODEL,
    inputs: cleanText,
  });

  // The API may return nested arrays; flatten to 1D
  const embedding = Array.isArray(response[0])
    ? (response[0] as number[])
    : (response as number[]);

  return embedding;
}

/**
 * Generate embeddings for multiple texts in batch.
 * Processes sequentially to stay within free tier rate limits.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
    // Small delay to respect rate limits on free tier
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return embeddings;
}
