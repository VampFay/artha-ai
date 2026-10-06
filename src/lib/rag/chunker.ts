/**
 * Semantic chunking pipeline — split financial documents into embeddable chunks.
 *
 * WP2.2 — Hybrid RAG & vector storage.
 *
 * Strategy:
 *   1. Section-aware splitting for structured docs (bank statements, tax returns)
 *   2. Sliding-window fallback for free-form text
 *   3. Token-bounded (max 512 tokens per chunk, 64-token overlap)
 */

const MAX_CHUNK_TOKENS = 512;
const CHUNK_OVERLAP_TOKENS = 64;

// Rough token estimate — 1 token ≈ 4 chars for English text
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split a document into semantic chunks.
 * First tries section-based splitting (paragraphs, headers), then
 * falls back to sliding-window for very long unstructured text.
 */
export function chunkDocument(text: string, options?: {
  maxTokens?: number;
  overlapTokens?: number;
  documentType?: "bank_statement" | "tax_return" | "form_16" | "generic";
}): string[] {
  const maxTokens = options?.maxTokens ?? MAX_CHUNK_TOKENS;
  const overlap = options?.overlapTokens ?? CHUNK_OVERLAP_TOKENS;
  const docType = options?.documentType ?? "generic";

  if (!text || text.trim().length === 0) return [];

  // Section-aware splitting for structured docs
  if (docType === "bank_statement" || docType === "tax_return" || docType === "form_16") {
    const sections = splitBySection(text, docType);
    if (sections.length > 1) {
      return sections.flatMap(s => furtherSplit(s, maxTokens, overlap));
    }
  }

  // Generic: split by paragraph boundaries first, then sliding window
  return furtherSplit(text, maxTokens, overlap);
}

function splitBySection(text: string, docType: string): string[] {
  // Bank statements often have headers like "TRANSACTIONS", "SUMMARY", "FEES"
  // Tax returns have section numbers like "1. Salary", "2. House Property"
  if (docType === "bank_statement") {
    return text.split(/\n(?=[A-Z][A-Z ]{5,})/).filter(s => s.trim().length > 0);
  }
  if (docType === "tax_return") {
    return text.split(/\n(?=\d+\.\s+[A-Z])/).filter(s => s.trim().length > 0);
  }
  if (docType === "form_16") {
    return text.split(/\n(?=(?:PART|Part|Section|SECTION)\s+[A-Z\d])/).filter(s => s.trim().length > 0);
  }
  return [text];
}

function furtherSplit(text: string, maxTokens: number, overlap: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  let current = "";
  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);
    const currentTokens = estimateTokens(current);

    if (currentTokens + paraTokens > maxTokens && current) {
      chunks.push(current.trim());
      // Keep last `overlap` tokens of current chunk for context preservation
      const tail = current.slice(-overlap * 4);
      current = tail + "\n\n" + para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // If any single chunk is still too long, do a final sliding-window split
  return chunks.flatMap(c => {
    if (estimateTokens(c) <= maxTokens) return [c];
    return slidingWindowSplit(c, maxTokens, overlap);
  });
}

function slidingWindowSplit(text: string, maxTokens: number, overlap: number): string[] {
  const chunks: string[] = [];
  const targetChars = maxTokens * 4;
  const overlapChars = overlap * 4;

  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + targetChars, text.length);
    const chunk = text.slice(i, end);
    if (chunk.trim()) chunks.push(chunk.trim());
    if (end === text.length) break;
    i = end - overlapChars;
    if (i < 0) i = 0;
  }
  return chunks;
}

/**
 * Estimate the total token count for a list of chunks.
 * Useful for budgeting LLM context windows.
 */
export function estimateTotalTokens(chunks: string[]): number {
  return chunks.reduce((sum, c) => sum + estimateTokens(c), 0);
}

export { estimateTokens };
