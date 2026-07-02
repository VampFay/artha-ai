"""Fix PageTransition placement in pages.

The sed approach put PageTransition outside ProtectedRoute (wrong) and
didn't add the import. This script:
1. Removes the misplaced PageTransition wrapper at the outer level
2. Adds the import
3. Wraps the *Content function's return in PageTransition
4. Ensures the closing tag is added
"""
import re
from pathlib import Path

PAGES = [
    "finance/page.tsx",
    "goals/page.tsx",
    "assistant/page.tsx",
    "reports/page.tsx",
    "settings/page.tsx",
    "goals/[id]/page.tsx",
]

BASE = Path("/home/z/my-project/finsight-ai/frontend/src/app")

for rel in PAGES:
    p = BASE / rel
    src = p.read_text()
    original = src

    # 1. Add import if missing.
    if "PageTransition" not in src.split("export default")[0]:
        # Insert after the ProtectedRoute import line.
        src = src.replace(
            'import ProtectedRoute from "@/components/ProtectedRoute";',
            'import ProtectedRoute from "@/components/ProtectedRoute";\nimport { PageTransition } from "@/components/PageTransition";',
        )

    # 2. Remove the misplaced outer PageTransition wrapper.
    # Pattern: return (\n    <PageTransition>\n    <ProtectedRoute>
    src = src.replace(
        "  return (\n    <PageTransition>\n    <ProtectedRoute>",
        "  return (\n    <ProtectedRoute>",
    )
    # And remove the extra closing that the sed added (if any).
    # Pattern: </ProtectedRoute>\n    </PageTransition>\n  );\n}
    src = src.replace(
        "    </ProtectedRoute>\n    </PageTransition>\n  );\n}",
        "    </ProtectedRoute>\n  );\n}",
    )

    # 3. The inner *Content function should already have <PageTransition> from sed.
    # Need to ensure it's closed. Find the *Content function and add closing tag.
    # Look for pattern: <PageTransition>\n    <div> ... </div>\n  );
    # And change to: <PageTransition>\n    <div> ... </div>\n    </PageTransition>\n  );

    # Use regex to find the content function's closing.
    # The content function ends with: </div>\n  );\n}
    # We need to add </PageTransition> before the ); only if PageTransition was opened inside.
    if "<PageTransition>\n    <div>" in src and "</PageTransition>" not in src.split("<PageTransition>\n    <div>", 1)[1]:
        # Add closing before the first );  after the PageTransition open
        idx = src.find("<PageTransition>\n    <div>")
        after = src[idx:]
        # Find the first "  );\n}" pattern after that
        close_match = re.search(r"(\n  \);\n\})", after)
        if close_match:
            insert_pos = idx + close_match.start()
            src = src[:insert_pos] + "\n    </PageTransition>" + src[insert_pos:]

    if src != original:
        p.write_text(src)
        print(f"  fixed: {rel}")
    else:
        print(f"  no change: {rel}")

print("done")
