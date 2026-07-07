import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const nomineeSchema = z.object({
  name: z.string().min(1).max(255),
  relation: z.string().max(100),
  allocation: z.number().min(0).max(100).default(0),
  assets: z.array(z.string().max(200)).max(50).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const [nominees, estateDocs, holdings] = await Promise.all([
      db.nominee.findMany({ where: { userId: payload.sub }, orderBy: { createdAt: "desc" } }),
      db.estateDocument.findMany({ where: { userId: payload.sub }, orderBy: { uploadedAt: "desc" } }),
      db.assetHolding.findMany({ where: { userId: payload.sub } }),
    ]);

    // Audit: find assets without nominees
    const assignedAssets = nominees.flatMap(n => {
      try { return JSON.parse(n.assets) as string[]; } catch { return []; }
    });
    const unassignedAssets = holdings.filter(h => !assignedAssets.includes(h.name));
    const unassignedCount = unassignedAssets.length;

    let auditMessage = "All assets have nominees assigned.";
    if (unassignedCount > 0) {
      auditMessage = `Your portfolio has ${unassignedCount} asset${unassignedCount > 1 ? "s" : ""} without clear nominees.`;
    }

    return NextResponse.json({
      nominees: nominees.map(n => ({
        id: n.id,
        name: n.name,
        relation: n.relation,
        allocation: n.allocation,
        status: n.status,
        assets: (() => { try { return JSON.parse(n.assets); } catch { return []; } })(),
      })),
      wills: estateDocs.map(d => ({
        id: d.id,
        name: d.name,
        docType: d.docType,
        uploadedAt: d.uploadedAt,
      })),
      audit: {
        unassignedAssetsCount: unassignedCount,
        auditMessage,
      },
    });
  } catch {
    return NextResponse.json({ detail: "Failed to fetch estate data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = nomineeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ detail: "Invalid input", errors: parsed.error.issues }, { status: 400 });
    }
    const { name, relation, allocation, assets } = parsed.data;

    const nominee = await db.nominee.create({
      data: {
        userId: payload.sub,
        name,
        relation,
        allocation,
        status: "Pending Verification",
        assets: JSON.stringify(assets),
      },
    });

    await db.auditLog.create({ data: { userId: payload.sub, action: "nominee_added", details: JSON.stringify({ nominee_id: nominee.id, name }) } });

    return NextResponse.json({ id: nominee.id }, { status: 201 });
  } catch {
    return NextResponse.json({ detail: "Failed to add nominee" }, { status: 500 });
  }
}
