/**
 * Message Queue Abstraction
 * --------------------------
 * Pluggable backend for async job processing:
 *   - "memory" : dev fallback (in-process)
 *   - "redis"  : production light (BullMQ)
 *   - "sqs"    : AWS SQS (bank-grade, decoupled)
 *   - "kafka"  : AWS MSK (event streaming)
 *
 * Used by: bulk document processing, webhook delivery, report generation,
 *          core banking sync, scheduled jobs.
 */

import { createHash, randomUUID } from "crypto";

export type QueueBackend = "memory" | "redis" | "sqs" | "kafka";

export interface QueueMessage<T = any> {
  id: string;
  type: string;
  payload: T;
  tenantId?: string;
  delaySeconds?: number;
  priority?: number;
  createdAt: number;
}

export interface QueueStats {
  depth: number;
  inFlight: number;
  deadLetterCount: number;
}

// ============================================================
// In-memory queue (dev only)
// ============================================================

class MemoryQueue {
  private queues: Map<string, QueueMessage[]> = new Map();
  private deadLetters: Map<string, QueueMessage[]> = new Map();

  async publish<T>(queueName: string, msg: Omit<QueueMessage<T>, "id" | "createdAt">): Promise<string> {
    const id = randomUUID();
    const fullMsg: QueueMessage<T> = {
      ...msg,
      id,
      createdAt: Date.now(),
    };
    if (!this.queues.has(queueName)) this.queues.set(queueName, []);
    this.queues.get(queueName)!.push(fullMsg);
    return id;
  }

  async consume<T>(queueName: string, handler: (msg: QueueMessage<T>) => Promise<void>): Promise<void> {
    // In production: long-poll
    const queue = this.queues.get(queueName) || [];
    while (queue.length > 0) {
      const msg = queue.shift()!;
      try {
        await handler(msg);
      } catch (err) {
        // Move to DLQ
        if (!this.deadLetters.has(queueName)) this.deadLetters.set(queueName, []);
        this.deadLetters.get(queueName)!.push(msg);
      }
    }
  }

  async getStats(queueName: string): Promise<QueueStats> {
    return {
      depth: this.queues.get(queueName)?.length || 0,
      inFlight: 0,
      deadLetterCount: this.deadLetters.get(queueName)?.length || 0,
    };
  }
}

// ============================================================
// AWS SQS Provider
// ============================================================

class SqsQueue {
  private sqs: any = null;
  private region: string;
  private queueUrlCache: Map<string, string> = new Map();

  constructor() {
    this.region = process.env.AWS_REGION || "ap-south-1";
  }

  private async getClient() {
    if (this.sqs) return this.sqs;
    const mod: any = await import("@aws-sdk/client-sqs").catch(() => ({} as any));
    if (!mod.SQSClient) throw new Error("@aws-sdk/client-sqs not installed");
    this.sqs = new mod.SQSClient({ region: this.region });
    return { sqs: this.sqs, mod };
  }

  private async getQueueUrl(queueName: string): Promise<string> {
    if (this.queueUrlCache.has(queueName)) return this.queueUrlCache.get(queueName)!;
    const { sqs, mod } = await this.getClient();
    const res = await sqs.send(new mod.GetQueueUrlCommand({ QueueName: queueName }));
    this.queueUrlCache.set(queueName, res.QueueUrl);
    return res.QueueUrl;
  }

  async publish<T>(queueName: string, msg: Omit<QueueMessage<T>, "id" | "createdAt">): Promise<string> {
    const id = randomUUID();
    const { sqs, mod } = await this.getClient();
    const queueUrl = await this.getQueueUrl(queueName);

    await sqs.send(new mod.SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({ ...msg, id, createdAt: Date.now() }),
      MessageDeduplicationId: id, // FIFO dedup
      DelaySeconds: msg.delaySeconds || 0,
    }));

    return id;
  }

  async consume<T>(queueName: string, handler: (msg: QueueMessage<T>) => Promise<void>): Promise<void> {
    const { sqs, mod } = await this.getClient();
    const queueUrl = await this.getQueueUrl(queueName);

    // Long-poll
    const res = await sqs.send(new mod.ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    }));

    if (!res.Messages) return;

    for (const sqsMsg of res.Messages) {
      try {
        const msg: QueueMessage<T> = JSON.parse(sqsMsg.Body);
        await handler(msg);
        await sqs.send(new mod.DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: sqsMsg.ReceiptHandle,
        }));
      } catch (err) {
        // Message will become visible again after visibility timeout
        // After max retries, it goes to DLQ (configured on SQS)
        console.error(`Failed to process message ${sqsMsg.MessageId}:`, err);
      }
    }
  }

  async getStats(queueName: string): Promise<QueueStats> {
    const { sqs, mod } = await this.getClient();
    const queueUrl = await this.getQueueUrl(queueName);

    const res = await sqs.send(new mod.GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: [
        "ApproximateNumberOfMessages",
        "ApproximateNumberOfMessagesNotVisible",
        "ApproximateNumberOfMessagesDelayed",
      ],
    }));

    return {
      depth: parseInt(res.Attributes?.ApproximateNumberOfMessages || "0"),
      inFlight: parseInt(res.Attributes?.ApproximateNumberOfMessagesNotVisible || "0"),
      deadLetterCount: 0, // DLQ is a separate queue
    };
  }
}

// ============================================================
// Kafka Provider (MSK)
// ============================================================

class KafkaQueue {
  private producer: any = null;
  private consumer: any = null;
  private brokers: string[];

  constructor() {
    this.brokers = (process.env.KAFKA_BROKERS || "").split(",").filter(Boolean);
  }

  private async getProducer() {
    if (this.producer) return this.producer;
    // @ts-ignore — kafkajs is an optional dependency
    const { Kafka } = await import("kafkajs").catch(() => ({} as any));
    if (!Kafka) throw new Error("kafkajs not installed");
    const kafka = new Kafka({
      clientId: "artha-ai",
      brokers: this.brokers,
      ssl: true,
      sasl: {
        mechanism: "aws-iam",
        authorizationProvider: async () => {
          // AWS MSK IAM auth
          return "";
        },
      },
    });
    this.producer = kafka.producer();
    await this.producer.connect();
    return this.producer;
  }

  async publish<T>(queueName: string, msg: Omit<QueueMessage<T>, "id" | "createdAt">): Promise<string> {
    const id = randomUUID();
    const producer = await this.getProducer();
    await producer.send({
      topic: queueName,
      messages: [{
        key: msg.tenantId || id,
        value: JSON.stringify({ ...msg, id, createdAt: Date.now() }),
        headers: {
          "x-tenant-id": msg.tenantId || "",
          "x-message-type": msg.type,
        },
      }],
    });
    return id;
  }

  async consume<T>(queueName: string, handler: (msg: QueueMessage<T>) => Promise<void>): Promise<void> {
    // In production: long-running consumer in a worker process
    throw new Error("Kafka consumer should run in a dedicated worker process");
  }

  async getStats(queueName: string): Promise<QueueStats> {
    // Use Kafka AdminClient to get topic lag
    return { depth: 0, inFlight: 0, deadLetterCount: 0 };
  }
}

// ============================================================
// Provider selection
// ============================================================

let _provider: any = null;

function getQueueProvider(): any {
  if (_provider) return _provider;
  const backend = (process.env.QUEUE_BACKEND || "memory") as QueueBackend;
  switch (backend) {
    case "sqs":
      _provider = new SqsQueue();
      break;
    case "kafka":
      _provider = new KafkaQueue();
      break;
    case "redis":
      // Use existing job-queue.ts (BullMQ)
      _provider = null; // handled separately
      break;
    case "memory":
    default:
      _provider = new MemoryQueue();
      break;
  }
  return _provider;
}

export async function publishToQueue<T>(
  queueName: string,
  msg: Omit<QueueMessage<T>, "id" | "createdAt">
): Promise<string> {
  const provider = getQueueProvider();
  if (!provider) throw new Error("Queue backend not configured");
  return provider.publish(queueName, msg);
}

export async function consumeFromQueue<T>(
  queueName: string,
  handler: (msg: QueueMessage<T>) => Promise<void>
): Promise<void> {
  const provider = getQueueProvider();
  if (!provider) throw new Error("Queue backend not configured");
  return provider.consume(queueName, handler);
}

export async function getQueueStats(queueName: string): Promise<QueueStats> {
  const provider = getQueueProvider();
  if (!provider) return { depth: 0, inFlight: 0, deadLetterCount: 0 };
  return provider.getStats(queueName);
}
