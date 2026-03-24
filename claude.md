# Skjold Bode — BK Skjold Football Team Management

A web app for BK Skjold football team: fine management, data tracking, team generation, and more.

## Tech Stack

- **Runtime**: Bun
- **Backend**: Hono REST API (port 3000), SQLite via `bun:sqlite`
- **Frontend**: React + Vite (port 5173) + TailwindCSS + shadcn/ui
- **E2E Tests**: Playwright
- **Language**: TypeScript, all UI in Danish

## Development

```bash
# Start both servers
bun run dev

# Run E2E tests
cd e2e && npx playwright test
```

## Ralph Loop

This project is built iteratively via a Ralph Loop. See `.ralph/` for:
- `PROMPT.md` — entry prompt for each iteration
- `PRD.md` — acceptance criteria per round
- `progress.txt` — current state and resume info

Run the loop: `./ralph.sh`

## Conventions

- All UI text in Danish
- E2E tests use Page Object pattern with `data-testid` locators
- data-testid naming: `{domain}-{element}[-{qualifier}]`
- API routes under `/api/`
- Auth via session cookie (credentials from `.env`)
