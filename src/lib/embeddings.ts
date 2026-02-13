import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || "");

const EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5";

/**
 * Generate embedding for a single text using HuggingFace Inference API.
 * Returns a 384-dimensional vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text.replace(/\n/g, " ").trim();

  // Updated router URL for HuggingFace Inference API
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: cleanText }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `HuggingFace API Error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const result = await response.json();

  // The API may return nested arrays; flatten to 1D
  // Result format: [0.1, 0.2, ...] or [[0.1, 0.2, ...]]
  let embedding: number[];

  if (Array.isArray(result)) {
    if (Array.isArray(result[0])) {
      embedding = result[0] as number[];
    } else {
      embedding = result as number[];
    }
  } else {
    throw new Error("Unexpected response format from HuggingFace API");
  }

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
