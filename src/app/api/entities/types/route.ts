/**
 * GET /api/entities/types
 * Returns all entity types grouped by category, with their tax applicability.
 * Used by the entity onboarding flow.
 */

import { NextResponse } from "next/server";
import { ENTITY_CATEGORIES, ENTITY_TYPES } from "@/lib/entity/types";

export async function GET() {
  return NextResponse.json({
    data: {
      categories: ENTITY_CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        description: cat.description,
        types: cat.types.map((type) => {
          const def = ENTITY_TYPES[type];
          return {
            type: def.type,
            label: def.label,
            shortLabel: def.shortLabel,
            description: def.description,
            iconEmoji: def.iconEmoji,
            taxRegime: def.taxRegime,
            gstApplicable: def.gstApplicable,
            tdsApplicable: def.tdsApplicable,
            csrApplicable: def.csrApplicable,
            matApplicable: def.matApplicable,
            regulators: def.regulators,
          };
        }),
      })),
      totalTypes: Object.keys(ENTITY_TYPES).length,
    },
  });
}
