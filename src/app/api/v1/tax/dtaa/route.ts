/**
 * GET /api/v1/tax/dtaa?country=US&type=dividend&hasPAN=true&hasTRC=true&hasForm10F=true
 * Returns applicable withholding rate for payments to non-residents.
 */

import { NextRequest } from "next/server";
import { getWithholdingRate, listDtaaCountries, type IncomeType } from "@/lib/tax/dtaa-matrix";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const country = url.searchParams.get("country");
  const type = url.searchParams.get("type") as IncomeType | null;

  // If no params, list all DTAA countries
  if (!country && !type) {
    return Response.json({
      data: {
        countries: listDtaaCountries(),
        incomeTypes: ["dividend", "interest", "royalty", "fts", "capital_gains"],
      },
    });
  }

  if (!country || !type) {
    return Response.json(
      { error: { code: "AR006", message: "Missing 'country' or 'type' parameter" } },
      { status: 400 }
    );
  }

  const hasPAN = url.searchParams.get("hasPAN") !== "false";
  const hasTRC = url.searchParams.get("hasTRC") !== "false";
  const hasForm10F = url.searchParams.get("hasForm10F") !== "false";

  const result = getWithholdingRate(country, type, hasPAN, hasTRC, hasForm10F);

  return Response.json({ data: result });
}
