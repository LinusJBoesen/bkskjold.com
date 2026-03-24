import { Hono } from "hono";
import { cors } from "hono/cors";
import { migrate } from "./db/migrate";
import { seed } from "./db/seed";

// Run migrations and seed on startup
migrate();
seed();

const app = new Hono();

app.use("/*", cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log("Backend running on http://localhost:3000");
