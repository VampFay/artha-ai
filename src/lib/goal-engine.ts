// Goal projection service
import { z } from "zod";

export const GoalCreateSchema = z.object({
  goal_name: z.string().min(1).max(255),
  target_amount: z.number().positive(),
  current_amount: z.number().min(0).optional().default(0),
  monthly_contribution: z.number().min(0).optional().default(0),
  target_date: z.string().optional(),
  expected_return_rate: z.number().min(0).max(0.3).optional().default(0),
});

export function projectGoal(target: number, current: number, monthly: number, targetDate: Date | null, rate: number) {
  const r = rate / 12;
  const today = new Date();
  let monthsToTarget: number | null = null;
  if (targetDate) {
    monthsToTarget = Math.max(0, (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth()));
  }

  let projectedAtTarget = 0;
  if (monthsToTarget !== null) projectedAtTarget = fv(current, monthly, r, monthsToTarget);

  // Binary search for completion month
  let completionMonth: number | null = null;
  if (monthly > 0 || current >= target) {
    let lo = 0, hi = 600;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (fv(current, monthly, r, mid) >= target) hi = mid;
      else lo = mid + 1;
    }
    if (lo < 600) completionMonth = lo;
  }

  let projectedDate: string | null = null;
  if (completionMonth !== null) {
    const d = new Date(today.getFullYear(), today.getMonth() + completionMonth, 1);
    projectedDate = d.toISOString();
  }

  const shortfall = monthsToTarget !== null ? Math.max(0, target - projectedAtTarget) : 0;

  let monthlyNeeded = 0;
  if (monthsToTarget !== null && monthsToTarget > 0) {
    if (r === 0) monthlyNeeded = Math.max(0, (target - current) / monthsToTarget);
    else {
      const gf = Math.pow(1 + r, monthsToTarget);
      const af = (gf - 1) / r;
      monthlyNeeded = Math.max(0, (target - current * gf) / af);
    }
  }

  return {
    projected_completion_date: projectedDate,
    projected_amount_at_target_date: Math.round(projectedAtTarget * 100) / 100,
    shortfall: Math.round(shortfall * 100) / 100,
    months_to_target: monthsToTarget,
    monthly_contribution_needed: Math.round(monthlyNeeded * 100) / 100,
  };
}

function fv(current: number, monthly: number, rate: number, months: number): number {
  if (rate === 0) return current + monthly * months;
  const gf = Math.pow(1 + rate, months);
  const af = (gf - 1) / rate;
  return current * gf + monthly * af;
}

/**
 * Generate goal scenarios for visualization.
 */
export function generateGoalScenarios(
  target: number,
  current: number,
  monthly: number,
  targetDate: Date | null,
  rate: number
): Array<{ label: string; monthly_contribution: number; projected_completion_date: string | null; months_to_complete: number | null }> {
  const scenarios: Array<{ label: string; monthly_contribution: number; projected_completion_date: string | null; months_to_complete: number | null }> = [];

  if (targetDate) {
    const proj = projectGoal(target, current, monthly, targetDate, rate);
    scenarios.push({
      label: "Needed to meet on time",
      monthly_contribution: proj.monthly_contribution_needed,
      projected_completion_date: targetDate.toISOString(),
      months_to_complete: proj.months_to_target,
    });
  }
  return scenarios;
}
