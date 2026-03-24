#!/usr/bin/env bash
set -euo pipefail

MAX_ITERATIONS=30
TIMEOUT_MINUTES=25
COMPLETION_PROMISE="SKJOLD_BODE_UI_COMPLETE"
PROMPT_FILE=".ralph/PROMPT.md"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo "=== Ralph Loop iteration $i / $MAX_ITERATIONS ==="

  PROMPT=$(cat "$PROMPT_FILE")
  OUTPUT=$(claude -p --dangerously-skip-permissions "$PROMPT" 2>&1) || true
  echo "$OUTPUT"

  if echo "$OUTPUT" | grep -q "$COMPLETION_PROMISE"; then
    echo "=== Ralph Loop COMPLETE at iteration $i ==="
    exit 0
  fi

  echo "=== Iteration $i finished, restarting with fresh context ==="
done

echo "=== Ralph Loop hit MAX_ITERATIONS ($MAX_ITERATIONS) without completing ==="
exit 1
