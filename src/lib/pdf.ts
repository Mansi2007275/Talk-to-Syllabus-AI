/**
 * PDF text extraction and chunking utilities.
 */

/**
 * Extract text from a PDF buffer using pdf-parse.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid issues with edge runtime
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

/**
 * Split text into overlapping chunks suitable for embedding.
 *
 * @param text - The full document text
 * @param maxTokens - Approximate max tokens per chunk (1 token approximately 4 chars)
 * @param overlap - Number of characters to overlap between chunks
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  maxTokens: number = 600,
  overlap: number = 200
): string[] {
  const maxChars = maxTokens * 4; // rough token-to-char estimate
  const chunks: string[] = [];

  // Clean up text
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length <= maxChars) {
    return [cleaned];
  }

  // Split by paragraphs first, then sentences
  const paragraphs = cleaned.split(/\n\n+/);
  let currentChunk = "";

  for (const para of paragraphs) {
    if ((currentChunk + " " + para).length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from the end of the current chunk
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + " " + para;
    } else {
      currentChunk = currentChunk ? currentChunk + " " + para : para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If any chunk is still too large, split by sentences
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > maxChars * 1.5) {
      const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
      let subChunk = "";
      for (const sentence of sentences) {
        if ((subChunk + sentence).length > maxChars && subChunk.length > 0) {
          finalChunks.push(subChunk.trim());
          subChunk = sentence;
        } else {
          subChunk += sentence;
        }
      }
      if (subChunk.trim()) finalChunks.push(subChunk.trim());
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks.filter((c) => c.length > 50); // Filter out tiny fragments
}
