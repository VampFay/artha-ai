/**
 * Realtime event bus — Socket.io server with Redis adapter for multi-instance
 * fan-out. Workers emit 'document:completed' / 'document:failed' / 'report:completed'
 * events when async jobs finish; the server pushes them to connected clients.
 *
 * WP2.1 — optimistic UI updates on job completion.
 */
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { getRedis } from "@/lib/redis";
import { logger } from "@/lib/logger";

let io: SocketIOServer | null = null;

export async function getIO(): Promise<SocketIOServer | null> {
  if (io) return io;

  // Lazy-init — only when first called (e.g., from worker or API route)
  // The actual HTTP server is bound by Next.js custom server or a separate
  // worker process. For serverless deploys, use Socket.io's Redis emitter
  // (no long-lived HTTP server needed).
  const redis = getRedis();
  if (!redis) {
    logger.warn({}, "Socket.io init skipped — REDIS_URL not set");
    return null;
  }

  // Create a separate Redis client for pub/sub (the main client can't be used
  // because once subscribed it can't issue other commands)
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();

  await Promise.all([
    new Promise<void>((resolve) => pubClient.connect().then(() => resolve())),
    new Promise<void>((resolve) => subClient.connect().then(() => resolve())),
  ]);

  io = new SocketIOServer({
    adapter: createAdapter(pubClient, subClient),
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    // Auth — verify JWT from handshake
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("auth_required"));
    // TODO: verify JWT and attach userId to socket.data.userId
    socket.data.userId = "anonymous"; // placeholder
    next();
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "socket connected");
    socket.join(`user:${socket.data.userId}`);

    socket.on("subscribe:document", (docId: string) => {
      socket.join(`document:${docId}`);
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "socket disconnected");
    });
  });

  return io;
}

/**
 * Emit a document completion event to all subscribers.
 * Called from the worker process after BullMQ job finishes.
 */
export async function emitDocumentCompleted(documentId: string, userId: string, result: unknown) {
  const io = await getIO();
  if (!io) return;
  io.to(`user:${userId}`).to(`document:${documentId}`).emit("document:completed", {
    documentId,
    result,
    timestamp: new Date().toISOString(),
  });
}

export async function emitDocumentFailed(documentId: string, userId: string, error: string) {
  const io = await getIO();
  if (!io) return;
  io.to(`user:${userId}`).to(`document:${documentId}`).emit("document:failed", {
    documentId, error, timestamp: new Date().toISOString(),
  });
}
