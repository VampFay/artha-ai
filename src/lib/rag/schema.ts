/**
 * pgvector schema for DocumentChunk.
 * WP2.2 — Hybrid RAG & vector storage.
 */
export const EMBEDDING_DIMENSIONS = 384;
export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";

export const PGVECTOR_SQL = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "DocumentChunk" (
  id          TEXT PRIMARY KEY,
  documentId  TEXT NOT NULL,
  userId      TEXT NOT NULL,
  chunkIndex  INTEGER NOT NULL,
  text        TEXT NOT NULL,
  embedding   vector(${EMBEDDING_DIMENSIONS}),
  metadata    JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_document ON "DocumentChunk"("documentId");
CREATE INDEX IF NOT EXISTS idx_doc_chunks_user ON "DocumentChunk"("userId");
`;

export interface DocumentChunk {
  id: string;
  documentId: string;
  userId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  metadata?: {
    page?: number;
    section?: string;
    tokenCount?: number;
    source?: string;
  };
  createdAt: Date;
}
