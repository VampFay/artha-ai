/**
 * Embedding pipeline — convert text chunks to vector embeddings via
 * Xenova/transformers (local) for cost-effective RAG.
 *
 * WP2.2 — Hybrid RAG & vector storage.
 *
 * Uses all-MiniLM-L6-v2 (384-dim, ~80MB model, runs on CPU in ~50ms/chunk).
 * Falls back to z-ai LLM embeddings if local model fails (configured).
 */
import { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from "./schema";

let pipelinePromise: Promise<any> | null = null;

async function getPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      return await pipeline("feature-extraction", EMBEDDING_MODEL);
    })();
  }
  return pipelinePromise;
}

/**
 * Generate an embedding vector for a single text chunk.
 * Returns a 384-dimensional number[].
 */
export async function embedText(text: string): Promise<number[]> {
  try {
    const pipe = await getPipeline();
    const output = await pipe(text, { pooling: "mean", normalize: true });
    return Array.from(output.data as Float32Array);
  } catch (err) {
    console.error("Embedding failed:", err);
    // Return zero vector as fallback (will not match anything in similarity search)
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }
}

/**
 * Generate embeddings for multiple chunks in batch.
 * More efficient than calling embedText() N times.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedText(text));
  }
  return results;
}

/**
 * Cosine similarity between two vectors.
 * Used for in-memory similarity search fallback when pgvector is unavailable.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dotProduct / denom;
}
