import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { migrate } from "./db/migrate";
import { seed } from "./db/seed";
import authRoutes from "./routes/auth";
import playerRoutes from "./routes/players";
import syncRoutes from "./routes/sync";
import fineRoutes from "./routes/fines";
import teamRoutes from "./routes/teams";
import matchRoutes from "./routes/matches";
import statsRoutes from "./routes/stats";
import tournamentRoutes from "./routes/tournament";
import analysisRoutes from "./routes/analysis";
import adminRoutes from "./routes/admin";
import formationRoutes from "./routes/formations";
import fanSignupRoutes from "./routes/fan-signup";
import bodekasseRoutes from "./routes/bodekasse";
import dbuRoutes from "./routes/dbu";
import { authMiddleware } from "./middleware/auth";
import { sql } from "./lib/db";

// Run migrations and seed on startup
await migrate();
await seed();

const app = new Hono();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use("/*", cors({
  origin: (origin) => allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  credentials: true,
}));

// Public routes
app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/api/auth", authRoutes);

// Test seed endpoint — creates test data for E2E tests (non-production only)
app.post("/api/test/seed", async (c) => {
  const { randomUUID } = await import("crypto");

  const players = [
    { id: "player-1", first_name: "Anders", last_name: "Jensen", display_name: "Anders J." },
    { id: "player-2", first_name: "Mikkel", last_name: "Nielsen", display_name: "Mikkel N." },
    { id: "player-3", first_name: "Lars", last_name: "Pedersen", display_name: "Lars P." },
    { id: "player-4", first_name: "Christian", last_name: "Hansen", display_name: "Christian H." },
    { id: "player-5", first_name: "Frederik", last_name: "Andersen", display_name: "Frederik A." },
    { id: "player-6", first_name: "Søren", last_name: "Christensen", display_name: "Søren C." },
  ];

  for (const p of players) {
    await sql`
      INSERT INTO players (id, first_name, last_name, display_name)
      VALUES (${p.id}, ${p.first_name}, ${p.last_name}, ${p.display_name})
      ON CONFLICT (id) DO NOTHING
    `;
  }

  const fines = [
    { id: randomUUID(), player_id: "player-1", fine_type_id: "missing_training", amount: 30, paid: 0 },
    { id: randomUUID(), player_id: "player-1", fine_type_id: "no_response_24h", amount: 60, paid: 1 },
    { id: randomUUID(), player_id: "player-2", fine_type_id: "missing_match", amount: 100, paid: 0 },
    { id: randomUUID(), player_id: "player-3", fine_type_id: "training_loss", amount: 25, paid: 0 },
  ];

  for (const f of fines) {
    await sql`
      INSERT INTO fines (id, player_id, fine_type_id, amount, paid)
      VALUES (${f.id}, ${f.player_id}, ${f.fine_type_id}, ${f.amount}, ${f.paid})
      ON CONFLICT DO NOTHING
    `;
  }

  // Clear previous DBU test data to avoid duplicates
  await sql`DELETE FROM dbu_standings`;
  await sql`DELETE FROM dbu_matches`;

  // DBU standings test data
  const standings = [
    { position: 1, team_name: "FC Nordvest", matches_played: 14, wins: 11, draws: 2, losses: 1, goal_diff: "+28", points: 35 },
    { position: 2, team_name: "BK Skjold", matches_played: 14, wins: 10, draws: 2, losses: 2, goal_diff: "+22", points: 32 },
    { position: 3, team_name: "Vanløse IF", matches_played: 14, wins: 8, draws: 3, losses: 3, goal_diff: "+14", points: 27 },
    { position: 4, team_name: "Husum BK", matches_played: 14, wins: 7, draws: 3, losses: 4, goal_diff: "+8", points: 24 },
    { position: 5, team_name: "Boldklubben af 1893", matches_played: 14, wins: 6, draws: 2, losses: 6, goal_diff: "+2", points: 20 },
    { position: 6, team_name: "FB Copenhagen", matches_played: 14, wins: 5, draws: 3, losses: 6, goal_diff: "-3", points: 18 },
    { position: 7, team_name: "Brønshøj BK", matches_played: 14, wins: 4, draws: 2, losses: 8, goal_diff: "-10", points: 14 },
    { position: 8, team_name: "Nørrebro United", matches_played: 14, wins: 3, draws: 3, losses: 8, goal_diff: "-15", points: 12 },
    { position: 9, team_name: "Østerbro IF", matches_played: 14, wins: 2, draws: 2, losses: 10, goal_diff: "-22", points: 8 },
    { position: 10, team_name: "Amager BK", matches_played: 14, wins: 1, draws: 2, losses: 11, goal_diff: "-24", points: 5 },
  ];

  for (const s of standings) {
    await sql`
      INSERT INTO dbu_standings (position, team_name, matches_played, wins, draws, losses, goal_diff, points)
      VALUES (${s.position}, ${s.team_name}, ${s.matches_played}, ${s.wins}, ${s.draws}, ${s.losses}, ${s.goal_diff}, ${s.points})
    `;
  }

  // DBU matches test data (with dbu_match_id)
  const dbuMatches = [
    { date: "2025-03-15", home_team: "BK Skjold", away_team: "Vanløse IF", home_score: 3, away_score: 1, dbu_match_id: "900001_489363" },
    { date: "2025-03-08", home_team: "Husum BK", away_team: "BK Skjold", home_score: 1, away_score: 2, dbu_match_id: "900002_489363" },
    { date: "2025-03-01", home_team: "BK Skjold", away_team: "FC Nordvest", home_score: 0, away_score: 1, dbu_match_id: "900003_489363" },
    { date: "2025-02-22", home_team: "Brønshøj BK", away_team: "BK Skjold", home_score: 0, away_score: 4, dbu_match_id: "900004_489363" },
    { date: "2025-02-15", home_team: "BK Skjold", away_team: "Nørrebro United", home_score: 2, away_score: 2, dbu_match_id: "900005_489363" },
  ];

  for (const m of dbuMatches) {
    await sql`
      INSERT INTO dbu_matches (date, home_team, away_team, home_score, away_score, dbu_match_id)
      VALUES (${m.date}, ${m.home_team}, ${m.away_team}, ${m.home_score}, ${m.away_score}, ${m.dbu_match_id})
    `;
  }

  // DBU team matches test data
  await sql`DELETE FROM dbu_team_matches`;
  const dbuTeamMatches = [
    { dbu_match_id: "900001_489363", team_id: "460174_489363", date: "2025-03-15", time: "14:00", home_team: "BK Skjold", home_team_id: "460174_489363", away_team: "Vanløse IF", away_team_id: "460175_489363", home_score: 3, away_score: 1, venue: "Østerbro Stadion" },
    { dbu_match_id: "900002_489363", team_id: "460174_489363", date: "2025-03-08", time: "15:00", home_team: "Husum BK", home_team_id: "460176_489363", away_team: "BK Skjold", away_team_id: "460174_489363", home_score: 1, away_score: 2, venue: "Husum Idrætsanlæg" },
    { dbu_match_id: "900003_489363", team_id: "460174_489363", date: "2025-03-01", time: "13:00", home_team: "BK Skjold", home_team_id: "460174_489363", away_team: "FC Nordvest", away_team_id: "460177_489363", home_score: 0, away_score: 1, venue: "Østerbro Stadion" },
    { dbu_match_id: "900004_489363", team_id: "460174_489363", date: "2025-02-22", time: "14:00", home_team: "Brønshøj BK", home_team_id: "460178_489363", away_team: "BK Skjold", away_team_id: "460174_489363", home_score: 0, away_score: 4, venue: "Brønshøj Stadion" },
    { dbu_match_id: "900005_489363", team_id: "460174_489363", date: "2025-02-15", time: "11:00", home_team: "BK Skjold", home_team_id: "460174_489363", away_team: "Nørrebro United", away_team_id: "460179_489363", home_score: 2, away_score: 2, venue: "Østerbro Stadion" },
  ];

  for (const tm of dbuTeamMatches) {
    await sql`
      INSERT INTO dbu_team_matches (dbu_match_id, team_id, date, time, home_team, home_team_id, away_team, away_team_id, home_score, away_score, venue)
      VALUES (${tm.dbu_match_id}, ${tm.team_id}, ${tm.date}, ${tm.time}, ${tm.home_team}, ${tm.home_team_id}, ${tm.away_team}, ${tm.away_team_id}, ${tm.home_score}, ${tm.away_score}, ${tm.venue})
      ON CONFLICT (dbu_match_id) DO NOTHING
    `;
  }

  // Opponent team matches (Vanløse IF) for common opponents testing
  const vanlosMatches = [
    { dbu_match_id: "900101_489363", team_id: "460175_489363", date: "2025-03-12", time: "19:00", home_team: "Vanløse IF", home_team_id: "460175_489363", away_team: "FC Nordvest", away_team_id: "460177_489363", home_score: 1, away_score: 2, venue: "Vanløse Idrætspark" },
    { dbu_match_id: "900102_489363", team_id: "460175_489363", date: "2025-03-05", time: "18:00", home_team: "Husum BK", home_team_id: "460176_489363", away_team: "Vanløse IF", away_team_id: "460175_489363", home_score: 0, away_score: 1, venue: "Husum Idrætsanlæg" },
    { dbu_match_id: "900103_489363", team_id: "460175_489363", date: "2025-02-26", time: "14:00", home_team: "Vanløse IF", home_team_id: "460175_489363", away_team: "Brønshøj BK", away_team_id: "460178_489363", home_score: 3, away_score: 0, venue: "Vanløse Idrætspark" },
    { dbu_match_id: "900104_489363", team_id: "460175_489363", date: "2025-02-19", time: "15:00", home_team: "Nørrebro United", home_team_id: "460179_489363", away_team: "Vanløse IF", away_team_id: "460175_489363", home_score: 1, away_score: 1, venue: "Nørrebro Park" },
  ];

  for (const tm of vanlosMatches) {
    await sql`
      INSERT INTO dbu_team_matches (dbu_match_id, team_id, date, time, home_team, home_team_id, away_team, away_team_id, home_score, away_score, venue)
      VALUES (${tm.dbu_match_id}, ${tm.team_id}, ${tm.date}, ${tm.time}, ${tm.home_team}, ${tm.home_team_id}, ${tm.away_team}, ${tm.away_team_id}, ${tm.home_score}, ${tm.away_score}, ${tm.venue})
      ON CONFLICT (dbu_match_id) DO NOTHING
    `;
  }

  return c.json({ success: true, players: players.length, fines: fines.length });
});

// Protected API routes
app.use("/api/*", async (c, next) => {
  const path = c.req.path;
  if (path === "/api/health" || path.startsWith("/api/auth") || path.startsWith("/api/test") || (path === "/api/fan-signup" && c.req.method === "POST")) {
    return next();
  }
  return authMiddleware(c, next);
});

app.route("/api/players", playerRoutes);
app.route("/api/sync", syncRoutes);
app.route("/api/fines", fineRoutes);
app.route("/api/teams", teamRoutes);
app.route("/api/matches", matchRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/tournament", tournamentRoutes);
app.route("/api/analysis", analysisRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/formations", formationRoutes);
app.route("/api/fan-signup", fanSignupRoutes);
app.route("/api/bodekasse", bodekasseRoutes);
app.route("/api/dbu", dbuRoutes);

// Serve frontend static files in production (built into backend/static by Dockerfile)
app.use("/*", serveStatic({ root: "./static" }));

// SPA fallback — serve index.html for non-API routes
app.get("*", serveStatic({ root: "./static", path: "index.html" }));

const port = parseInt(process.env.PORT || "3000");

export default {
  port,
  fetch: app.fetch,
};

console.log(`Backend running on http://localhost:${port}`);
