#!/usr/bin/env python3
"""
git-filter-repo message callback.

Strips attribution / collaboration trailers from commit messages:
  - Co-Authored-By: ...
  - Signed-off-by: ...
  - Generated-by: ... / Generated with ...
  - Reviewed-by: ...
  - Tested-by: ...
  - Reported-by: ...
  - Suggested-by: ...
  - Acked-by: ...
  - Helped-by: ...

These trailers reveal other contributors / bots and are the "comments"
that need to be removed when collapsing history to a single author.

Also strips any standalone line that mentions "dependabot" to remove
bot attribution from dependabot-squashed commits.
"""
import re
import sys

# Allow importing when used as a callback module
sys.path.insert(0, '/home/z/my-project/scripts')

TRAILER_PATTERNS = [
    rb'^\s*co-authored-by:.*$',
    rb'^\s*signed-off-by:.*$',
    rb'^\s*generated-by:.*$',
    rb'^\s*generated with.*$',
    rb'^\s*reviewed-by:.*$',
    rb'^\s*tested-by:.*$',
    rb'^\s*reported-by:.*$',
    rb'^\s*suggested-by:.*$',
    rb'^\s*acked-by:.*$',
    rb'^\s*helped-by:.*$',
    rb'^\s*cc:.*$',
    rb'^\s*dependabot.*$',
]

COMBINED = re.compile(rb'|'.join(TRAILER_PATTERNS), re.IGNORECASE | re.MULTILINE)


def strip_trailers(message):
    """git-filter-repo --message-callback signature: takes bytes, returns bytes."""
    if not isinstance(message, (bytes, bytearray)):
        message = message.encode('utf-8', errors='replace')
    new = COMBINED.sub(rb'', message)
    # Collapse multiple blank lines that result from stripping
    new = re.sub(rb'\n{3,}', rb'\n\n', new)
    # Strip trailing whitespace / blank lines at end
    new = re.sub(rb'\s+\Z', rb'\n', new)
    return new


# Module-level callable matching git-filter-repo's expected interface:
# `--message-callback 'return strip_trailers(message)'` -- but we can't import
# in that tiny scope. Instead, register via module path.

def message_callback(message):
    return strip_trailers(message)
