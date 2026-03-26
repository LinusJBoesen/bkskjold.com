import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";

export type SessionData = {
  email: string;
  role: 'admin' | 'spiller' | 'fan';
  userId: string;
  createdAt: number;
};

const sessions = new Map<string, SessionData>();

export function createSession(email: string, role: SessionData['role'] = 'admin', userId: string = ''): string {
  const token = crypto.randomUUID();
  sessions.set(token, { email, role, userId, createdAt: Date.now() });
  return token;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function getSession(token: string): SessionData | undefined {
  return sessions.get(token);
}

export function destroySessionsByUserId(userId: string): void {
  for (const [token, session] of sessions) {
    if (session.userId === userId) {
      sessions.delete(token);
    }
  }
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, "session");
  if (!token || !sessions.has(token)) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("session" as never, sessions.get(token)!);
  await next();
});

export function requireRole(...roles: string[]) {
  return createMiddleware(async (c, next) => {
    const session = c.get("session" as never) as SessionData | undefined;
    if (!session || !roles.includes(session.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  });
}
