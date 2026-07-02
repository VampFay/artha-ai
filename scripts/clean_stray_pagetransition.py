"""Remove stray <PageTransition> tags that sed incorrectly inserted
inside .map() callbacks. Only keep the top-level one wrapping the
Content function's main <div>.
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

    # Remove any <PageTransition> that appears inside a .map() callback,
    # i.e. preceded by "return (\n" at deeper indentation (6+ spaces).
    # Pattern: whitespace + return (\n + whitespace + <PageTransition>
    src = re.sub(
        r"(\n\s+return \(\n\s+)<PageTransition>\n",
        r"\1",
        src,
    )

    # Also remove orphan closing </PageTransition> that may have been added
    # for those stray opens. Look for </PageTransition> not matching an open.
    # Count opens vs closes — if closes > opens, remove the extras.
    opens = len(re.findall(r"<PageTransition>", src))
    closes = len(re.findall(r"</PageTransition>", src))
    while closes > opens:
        # Remove the last </PageTransition>
        idx = src.rfind("</PageTransition>")
        if idx == -1:
            break
        # Remove the line containing it
        line_start = src.rfind("\n", 0, idx)
        line_end = src.find("\n", idx)
        if line_end == -1:
            line_end = len(src)
        src = src[:line_start] + src[line_end:]
        closes -= 1

    if src != original:
        p.write_text(src)
        print(f"  cleaned: {rel}")
    else:
        print(f"  no change: {rel}")
