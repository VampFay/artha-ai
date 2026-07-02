import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { GoalCreateSchema, projectGoal } from "@/lib/goal-engine";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const goals = await db.goal.findMany({ where: { userId: payload.sub }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items: goals.map((g) => ({ ...g, goal_name: g.goalName, target_amount: g.targetAmount, current_amount: g.currentAmount, monthly_contribution: g.monthlyContribution, target_date: g.targetDate, expected_return_rate: g.expectedReturnRate, projection: projectGoal(g.targetAmount, g.currentAmount, g.monthlyContribution, g.targetDate, g.expectedReturnRate) })), total: goals.length });
  } catch { return NextResponse.json({ detail: "Failed to fetch goals" }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(auth.slice(7));
    if (!payload) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const parsed = GoalCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ detail: "Invalid goal data" }, { status: 422 });
    const d = parsed.data;
    const goal = await db.goal.create({ data: { userId: payload.sub, goalName: d.goal_name, targetAmount: d.target_amount, currentAmount: d.current_amount, monthlyContribution: d.monthly_contribution, targetDate: d.target_date ? new Date(d.target_date) : null, expectedReturnRate: d.expected_return_rate } });
    return NextResponse.json({ ...goal, goal_name: goal.goalName, target_amount: goal.targetAmount, current_amount: goal.currentAmount, monthly_contribution: goal.monthlyContribution, target_date: goal.targetDate, expected_return_rate: goal.expectedReturnRate, projection: projectGoal(goal.targetAmount, goal.currentAmount, goal.monthlyContribution, goal.targetDate, goal.expectedReturnRate) }, { status: 201 });
  } catch { return NextResponse.json({ detail: "Failed to create goal" }, { status: 500 }); }
}
