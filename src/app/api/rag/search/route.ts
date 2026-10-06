/**
 * RAG search API endpoint.
 * POST /api/rag/search
 *
 * WP2.2 — Query the vector store for relevant document chunks.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, errorResponse, AuthError } from "@/lib/security/middleware";
import { enforceRateLimit, RateLimitPolicies } from "@/lib/security/rate-limit";
import { embedText } from "@/lib/rag/embeddings";
import { similaritySearch, buildRagContext } from "@/lib/rag/vector-store";
import { logger } from "@/lib/logger";
import { z as Z } from "zod";

const SearchSchema = Z.object({
  query: Z.string().min(3).max(1000),
  documentIds: Z.array(Z.string()).optional(),
  topK: Z.number().int().min(1).max(50).default(5),
  returnContext: Z.boolean().default(false),
  maxTokens: Z.number().int().min(100).max(8000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const limited = await enforceRateLimit(req, "rag-search", RateLimitPolicies.AI, ctx.userId);
    if (limited) return limited;

    const body = await req.json();
    const parsed = SearchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: "invalid_request", message: parsed.error.issues[0]?.message } },
        { status: 400 },
      );
    }

    const { query, documentIds, topK, returnContext, maxTokens } = parsed.data;
    const startTime = Date.now();

    logger.info({ userId: ctx.userId, queryLength: query.length, topK }, "rag search starting");

    // 1. Embed the query
    const queryEmbedding = await embedText(query);
    if (queryEmbedding.every(v => v === 0)) {
      return NextResponse.json(
        { error: { code: "embedding_failed", message: "Failed to generate query embedding" } },
        { status: 500 },
      );
    }

    // 2. Search the vector store
    const results = await similaritySearch(queryEmbedding, {
      userId: ctx.userId,
      documentIds,
      topK,
      minScore: 0.3,
    });

    const elapsedMs = Date.now() - startTime;
    logger.info({ userId: ctx.userId, resultCount: results.length, elapsedMs }, "rag search complete");

    // 3. Optionally return ready-to-use context for LLM
    if (returnContext) {
      const { context, chunks } = await buildRagContext(queryEmbedding, {
        userId: ctx.userId,
        documentIds,
        topK,
        maxTokens,
      });
      return NextResponse.json({ results: chunks, context, elapsedMs });
    }

    return NextResponse.json({ results, elapsedMs });
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err);
    logger.error({ err }, "rag search failed");
    return errorResponse(err as Error);
  }
}
