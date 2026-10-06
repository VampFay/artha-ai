/**
 * Vector store — Postgres + pgvector for production, in-memory fallback for dev.
 *
 * WP2.2 — Hybrid RAG & vector storage.
 */
import { db } from "@/lib/db";
import { cosineSimilarity } from "./embeddings";
import type { DocumentChunk } from "./schema";

export interface SearchResult {
  chunkId: string;
  documentId: string;
  text: string;
  score: number; // 0-1, higher = more similar
  metadata?: Record<string, unknown>;
}

/**
 * Store document chunks with their embeddings.
 */
export async function storeChunks(chunks: DocumentChunk[]): Promise<void> {
  if (chunks.length === 0) return;

  // Try Postgres + pgvector first
  try {
    await db.$executeRaw`
      INSERT INTO "DocumentChunk" (id, "documentId", "userId", "chunkIndex", text, embedding, metadata, "createdAt")
      VALUES ${chunks.map((c, i) =>
        `(prisma_raw_query_placeholder_${i * 6}, prisma_raw_query_placeholder_${i * 6 + 1}, prisma_raw_query_placeholder_${i * 6 + 2}, prisma_raw_query_placeholder_${i * 6 + 3}, prisma_raw_query_placeholder_${i * 6 + 4}, prisma_raw_query_placeholder_${i * 6 + 5}::vector, prisma_raw_query_placeholder_${i * 6 + 6}, prisma_raw_query_placeholder_${i * 6 + 7})`
      ).join(",")}
    `;
  } catch (err) {
    // Fallback to in-memory store for dev
    for (const chunk of chunks) {
      memoryStore.set(chunk.id, chunk);
    }
  }
}

// In-memory fallback for dev (no pgvector installed)
const memoryStore = new Map<string, DocumentChunk>();

/**
 * Top-k similarity search for a query embedding.
 * Uses pgvector `<=>` (cosine distance) operator in production,
 * falls back to in-memory cosine similarity in dev.
 */
export async function similaritySearch(
  queryEmbedding: number[],
  options: {
    userId?: string;
    documentIds?: string[];
    topK?: number;
    minScore?: number;
  } = {},
): Promise<SearchResult[]> {
  const topK = options.topK ?? 5;
  const minScore = options.minScore ?? 0.3;

  // Try Postgres + pgvector
  try {
    const userFilter = options.userId ? `AND "userId" = $2` : "";
    const docFilter = options.documentIds?.length
      ? `AND "documentId" = ANY($3)`
      : "";

    const results = await db.$queryRaw<SearchResult[]>`
      SELECT id as "chunkId", "documentId", text, metadata,
             1 - (embedding <=> $1::vector) as score
      FROM "DocumentChunk"
      WHERE 1=1 ${userFilter} ${docFilter}
      ORDER BY embedding <=> $1::vector
      LIMIT ${topK}
    `;

    return results.filter(r => r.score >= minScore);
  } catch {
    // Fallback: in-memory cosine similarity
    const all: SearchResult[] = [];
    for (const chunk of memoryStore.values()) {
      if (options.userId && chunk.userId !== options.userId) continue;
      if (options.documentIds && !options.documentIds.includes(chunk.documentId)) continue;
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score >= minScore) {
        all.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          text: chunk.text,
          score,
          metadata: chunk.metadata as Record<string, unknown>,
        });
      }
    }
    return all.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}

/**
 * Build the augmented context string for an LLM query.
 * Returns the top-K chunks concatenated, with a token budget.
 */
export async function buildRagContext(
  queryEmbedding: number[],
  options: {
    userId?: string;
    documentIds?: string[];
    topK?: number;
    maxTokens?: number;
  } = {},
): Promise<{ context: string; chunks: SearchResult[] }> {
  const maxTokens = options.maxTokens ?? 2000;
  const results = await similaritySearch(queryEmbedding, {
    userId: options.userId,
    documentIds: options.documentIds,
    topK: options.topK ?? 10,
  });

  let context = "";
  let usedTokens = 0;
  const included: SearchResult[] = [];

  for (const r of results) {
    const chunkTokens = Math.ceil(r.text.length / 4);
    if (usedTokens + chunkTokens > maxTokens) break;
    context += `\n---\n${r.text}\n`;
    usedTokens += chunkTokens;
    included.push(r);
  }

  return { context: context.trim(), chunks: included };
}
