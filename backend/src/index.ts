import { Hono } from "hono";
import { cors } from "hono/cors";
import { migrate } from "./db/migrate";
import { seed } from "./db/seed";
import authRoutes from "./routes/auth";
import playerRoutes from "./routes/players";
import syncRoutes from "./routes/sync";
import fineRoutes from "./routes/fines";
import teamRoutes from "./routes/teams";
import matchRoutes from "./routes/matches";
import { authMiddleware } from "./middleware/auth";

// Run migrations and seed on startup
migrate();
seed();

const app = new Hono();

app.use("/*", cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// Public routes
app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

app.route("/api/auth", authRoutes);

// Protected API routes
app.use("/api/*", async (c, next) => {
  const path = c.req.path;
  if (path === "/api/health" || path.startsWith("/api/auth")) {
    return next();
  }
  return authMiddleware(c, next);
});

app.route("/api/players", playerRoutes);
app.route("/api/sync", syncRoutes);
app.route("/api/fines", fineRoutes);
app.route("/api/teams", teamRoutes);
app.route("/api/matches", matchRoutes);

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log("Backend running on http://localhost:3000");
