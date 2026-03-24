import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";

const sessions = new Map<string, { email: string; createdAt: number }>();

export function createSession(email: string): string {
  const token = crypto.randomUUID();
  sessions.set(token, { email, createdAt: Date.now() });
  return token;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function getSession(token: string) {
  return sessions.get(token);
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, "session");
  if (!token || !sessions.has(token)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("session" as never, sessions.get(token)!);
  await next();
});
