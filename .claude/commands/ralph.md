---
description: "Start a new Ralph Loop — discuss the task, scaffold PRD/PROMPT/progress, then run"
argument-hint: "[task description]"
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
---

# Ralph Loop Setup

You are helping the user set up and start a new Ralph Loop — an iterative development loop where Claude works autonomously through rounds of tasks.

## Step 1: Discuss the Task

If the user provided a task description as an argument, use that as a starting point. Otherwise, ask them:

1. **What do you want to build or fix?** (high-level goal)
2. **What are the specific tasks/issues?** (break into rounds)
3. **Any constraints or design direction?** (tech stack, style, rules)
4. **Completion criteria?** (how do we know it's done?)

Keep the discussion brief and focused. Once you have enough info, move to Step 2.

## Step 2: Create a Branch

**MANDATORY**: Ralph loops must NEVER run on `main`. Create a new branch before doing anything else:

```bash
git checkout -b ralph/<short-kebab-name>
```

Use a short descriptive name based on the task (e.g. `ralph/auth-fixes`, `ralph/tournament-upgrade`). If the user is already on a non-main branch, ask if they want to use the current branch or create a new one.

## Step 3: Check for Existing Loop

Before scaffolding, check if there's an active loop in `.ralph/`:

```
Read .ralph/progress.txt
```

If there's an active (non-complete) loop, ask the user if they want to:
- **Resume** it (just start the ralph loop)
- **Archive** it (move to oldloops, then scaffold new)

## Step 4: Archive Previous Loop (if needed)

If there are existing `.ralph/PRD.md`, `.ralph/PROMPT.md`, `.ralph/progress.txt` files from a completed or abandoned loop:

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_DIR=".ralph/oldloops/$TIMESTAMP"
mkdir -p "$ARCHIVE_DIR"
mv .ralph/PRD.md "$ARCHIVE_DIR/" 2>/dev/null || true
mv .ralph/PROMPT.md "$ARCHIVE_DIR/" 2>/dev/null || true
mv .ralph/progress.txt "$ARCHIVE_DIR/" 2>/dev/null || true
mv .ralph/.ralphrc "$ARCHIVE_DIR/" 2>/dev/null || true
mv .ralph/CHANGELOG.md "$ARCHIVE_DIR/" 2>/dev/null || true
```

## Step 5: Scaffold the Loop

Read the templates from `.ralph/templates/` for structure reference, then create customized versions:

1. **`.ralph/PRD.md`** — Product Requirements Document with rounds, acceptance criteria, and technical notes
2. **`.ralph/PROMPT.md`** — The prompt Claude sees each iteration (startup sequence, rules, completion promise). Must instruct Claude to exit after each round for fresh context restart.
3. **`.ralph/progress.txt`** — Progress tracker with round checklists (all unchecked)
4. **`.ralph/.ralphrc`** — Config (max iterations, completion promise, git workflow, DANGEROUSLY_SKIP_PERMISSIONS=true)
5. **`.ralph/CHANGELOG.md`** — Changelog tracking what each iteration accomplished

Use the templates as a base but customize them for the specific task.

## Step 6: Confirm and Start

Show the user a summary of:
- Number of rounds
- Completion promise
- Max iterations

Then ask: **"Ready to start the Ralph Loop?"**

If yes, tell them to run:
```
/ralph-loop <read the PROMPT.md content> --completion-promise '<PROMISE>' --max-iterations <N>
```

Or they can run `ralph.sh` for headless execution:
```bash
bash ralph.sh
```
