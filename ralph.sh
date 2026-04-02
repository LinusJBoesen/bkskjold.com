#!/usr/bin/env bash
set -euo pipefail

RALPH_DIR=".ralph"
RALPHRC="$RALPH_DIR/.ralphrc"
PROMPT_FILE="$RALPH_DIR/PROMPT.md"
PROGRESS_FILE="$RALPH_DIR/progress.txt"
CHANGELOG_FILE="$RALPH_DIR/CHANGELOG.md"
OLDLOOPS_DIR="$RALPH_DIR/oldloops"

# Load config
if [[ ! -f "$RALPHRC" ]]; then
  echo "No .ralphrc found. Run /ralph to set up a loop first."
  exit 1
fi
source "$RALPHRC"

# Check required files exist
if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "No PROMPT.md found in $RALPH_DIR. Run /ralph to set up a loop first."
  exit 1
fi

# Initialize changelog if it doesn't exist
if [[ ! -f "$CHANGELOG_FILE" ]]; then
  cat > "$CHANGELOG_FILE" <<EOF
# Ralph Loop Changelog

| Iteration | Round | Timestamp | Summary |
|-----------|-------|-----------|---------|
EOF
fi

# Archive function — moves completed loop files to oldloops/
archive_loop() {
  local timestamp
  timestamp=$(date +%Y%m%d_%H%M%S)
  local archive_dir="$OLDLOOPS_DIR/$timestamp"
  mkdir -p "$archive_dir"

  for f in PRD.md PROMPT.md progress.txt .ralphrc CHANGELOG.md; do
    [[ -f "$RALPH_DIR/$f" ]] && mv "$RALPH_DIR/$f" "$archive_dir/"
  done

  echo "Archived loop to $archive_dir"
}

# Check for --archive flag
if [[ "${1:-}" == "--archive" ]]; then
  archive_loop
  exit 0
fi

# Run the loop
for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo "=== Ralph Loop iteration $i / $MAX_ITERATIONS ==="

  PROMPT=$(cat "$PROMPT_FILE")
  OUTPUT=$(claude -p --dangerously-skip-permissions "$PROMPT" 2>&1) || true
  echo "$OUTPUT"

  # Log to changelog
  CURRENT_ROUND=$(grep -oP '^\- \*\*Round\*\*: \K.*' "$PROGRESS_FILE" 2>/dev/null || echo "?")
  SUMMARY=$(echo "$OUTPUT" | grep -oP 'git commit -m "\K[^"]+' | tail -1 || echo "iteration $i")
  echo "| $i | $CURRENT_ROUND | $(date +%Y-%m-%d\ %H:%M) | $SUMMARY |" >> "$CHANGELOG_FILE"

  if echo "$OUTPUT" | grep -q "$COMPLETION_PROMISE"; then
    echo "=== Ralph Loop COMPLETE at iteration $i ==="
    echo ""
    echo "Loop finished! To archive this loop run:"
    echo "  bash ralph.sh --archive"
    exit 0
  fi

  echo "=== Iteration $i finished, fresh context for next iteration ==="
done

echo "=== Ralph Loop hit MAX_ITERATIONS ($MAX_ITERATIONS) without completing ==="
exit 1
