import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/auth";
import { getClientIp } from "@/lib/security";
import { z } from "zod";

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = refreshSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ detail: "Invalid input" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || undefined;
    const ipAddress = getClientIp(req);

    const result = await rotateRefreshToken(parsed.data.refresh_token, userAgent, ipAddress);

    if (!result) {
      return NextResponse.json({ detail: "Invalid or expired refresh token" }, { status: 401 });
    }

    return NextResponse.json({
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
    });
  } catch {
    return NextResponse.json({ detail: "Failed to refresh token" }, { status: 500 });
  }
}
