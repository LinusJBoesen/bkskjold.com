import { Hono } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { createSession, destroySession, getSession } from "../middleware/auth";
import { sql } from "../lib/db";

const auth = new Hono();

auth.post("/register", async (c) => {
  const body = await c.req.json();
  const { name, email, password, role, spondEmail } = body;

  if (!name || !email || !password || !role) {
    return c.json({ error: "Alle felter er påkrævet" }, 400);
  }

  if (!["fan", "spiller"].includes(role)) {
    return c.json({ error: "Ugyldig rolle" }, 400);
  }

  if (password.length < 6) {
    return c.json({ error: "Adgangskode skal være mindst 6 tegn" }, 400);
  }

  // Check duplicate email
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return c.json({ error: "Email er allerede registreret" }, 409);
  }

  const hash = await Bun.password.hash(password, "bcrypt");
  const id = crypto.randomUUID();
  const approved = role === "fan" ? 1 : 0;

  // If spiller with spondEmail, try to find matching player
  let playerId: string | null = null;
  if (role === "spiller" && spondEmail) {
    // Try matching by display_name or direct lookup — pragmatic approach
    const players = await sql`SELECT id FROM players WHERE id = ${spondEmail} LIMIT 1`;
    if (players.length > 0) {
      playerId = players[0].id;
    }
  }

  await sql`
    INSERT INTO users (id, name, email, password_hash, role, player_id, approved)
    VALUES (${id}, ${name}, ${email}, ${hash}, ${role}, ${playerId}, ${approved})
  `;

  if (role === "fan") {
    return c.json({ success: true, message: "Konto oprettet. Du kan nu logge ind.", status: "approved" });
  }

  return c.json({ success: true, message: "Konto oprettet. Afventer godkendelse fra administrator.", status: "pending" });
});

auth.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  // First check DB users
  const users = await sql`SELECT id, email, name, role, password_hash, approved, player_id FROM users WHERE email = ${email}`;
  if (users.length > 0) {
    const user = users[0];
    const valid = await Bun.password.verify(password, user.password_hash);
    if (!valid) {
      return c.json({ error: "Ugyldige loginoplysninger" }, 401);
    }
    if (!user.approved) {
      return c.json({ error: "Afventer godkendelse" }, 403);
    }
    const token = createSession(user.email, user.role, user.id);
    const isProduction = !!process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production";
    setCookie(c, "session", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return c.json({ success: true, email: user.email });
  }

  // Fallback: env-based admin login
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
    const token = createSession(email, "admin", "env-admin");
    const isProduction = !!process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production";
    setCookie(c, "session", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return c.json({ success: true, email });
  }

  return c.json({ error: "Ugyldige loginoplysninger" }, 401);
});

auth.post("/logout", async (c) => {
  const token = getCookie(c, "session");
  if (token) {
    destroySession(token);
  }
  const isProduction = !!process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === "production";
  setCookie(c, "session", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
  return c.json({ success: true });
});

auth.get("/me", async (c) => {
  const token = getCookie(c, "session");
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const session = getSession(token);
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Fetch user details from DB if we have a real userId
  if (session.userId && session.userId !== "env-admin") {
    const users = await sql`SELECT name, player_id FROM users WHERE id = ${session.userId}`;
    if (users.length > 0) {
      return c.json({
        email: session.email,
        name: users[0].name,
        role: session.role,
        playerId: users[0].player_id,
      });
    }
  }

  // Env-admin fallback
  return c.json({ email: session.email, name: "Admin", role: session.role, playerId: null });
});

export default auth;
