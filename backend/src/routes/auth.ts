import { Hono } from "hono";
import { setCookie, getCookie } from "hono/cookie";
import { createSession, destroySession, getSession } from "../middleware/auth";

const auth = new Hono();

auth.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return c.json({ error: "Server misconfigured" }, 500);
  }

  if (email !== adminEmail || password !== adminPassword) {
    return c.json({ error: "Ugyldige loginoplysninger" }, 401);
  }

  const token = createSession(email);
  setCookie(c, "session", token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return c.json({ success: true, email });
});

auth.post("/logout", async (c) => {
  const token = getCookie(c, "session");
  if (token) {
    destroySession(token);
  }
  setCookie(c, "session", "", {
    httpOnly: true,
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
  return c.json({ email: session.email });
});

export default auth;
