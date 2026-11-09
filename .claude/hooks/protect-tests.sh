#!/bin/sh
# The test lock for the implementer agent (/build-task). Runs before each
# Edit, Write, MultiEdit, NotebookEdit or Bash call the implementer makes,
# and refuses any change to tests, TESTING.md, fixtures or the approved design. Exit 2 blocks
# the call and shows the message to the agent. The verifier's git check is
# the second lock: a shell command this misses is still caught there.
exec python3 -I -c '
import json, re, sys

PROTECTED = re.compile(
    r"(^|/)(app/src/__tests__/|app/packages/kitted-core/test/|firebase/tests/|handoff/fixtures/|app/e2e/)"
    r"|(^|/)tasks/[^/]+/(TESTING\.md|DESIGN\.md|design\.html)$|(^|/)tasks/[^/]+/design/"
    r"|\.test\.(ts|tsx|js|mjs)$"
)
PATH_IN_TEXT = re.compile(
    r"(app/src/__tests__/|kitted-core/test/|firebase/tests/|handoff/fixtures/|app/e2e/"
    r"|tasks/[^/\s]+/design/|\b(TESTING|DESIGN)\.md\b|\bdesign\.html\b|[\w./-]+\.test\.(ts|tsx|js|mjs))"
)
WRITES = re.compile(
    r"(sed\s+(-\w*\s+)*-i|perl\s+(-\w*\s+)*-i|\btee\b|\brm\b|\bmv\b|\bcp\b|\btruncate\b|\btouch\b"
    r"|git\s+(checkout|restore|rm|mv|apply)|\bpatch\b|open\(|writeFile)"
)
REDIRECT = re.compile(r"(?<![0-9&])>{1,2}\s*([^\s&|;]+)")

def block(why):
    sys.stderr.write(
        "Blocked: the implementer never edits tests, TESTING.md, fixtures or the approved design (" + why + "). "
        "If a test looks wrong, stop and write the dispute in tasks/<ID>/REPORT.md.\n")
    sys.exit(2)

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
tool = data.get("tool_name", "")
inp = data.get("tool_input") or {}

if tool in ("Edit", "Write", "MultiEdit", "NotebookEdit"):
    path = inp.get("file_path") or inp.get("notebook_path") or ""
    if PROTECTED.search(path):
        block(path)
elif tool == "Bash":
    cmd = inp.get("command", "")
    for target in REDIRECT.findall(cmd):
        if PROTECTED.search(target):
            block("writes " + target)
    if re.search(r"design-(shot|shell)\.sh", cmd):
        block("the design scripts rewrite the approved design")
    if PATH_IN_TEXT.search(cmd) and WRITES.search(cmd):
        block("a command that changes files names a protected path")
sys.exit(0)
'
