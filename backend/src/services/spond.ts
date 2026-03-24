const SPOND_API_BASE = "https://api.spond.com/core/v1";

interface SpondToken {
  token: string;
  expiresAt: number;
}

let cachedToken: SpondToken | null = null;

export class SpondClient {
  private username: string;
  private password: string;

  constructor() {
    this.username = process.env.SPOND_USERNAME || "";
    this.password = process.env.SPOND_PASSWORD || "";
  }

  private async authenticate(): Promise<string> {
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return cachedToken.token;
    }

    if (!this.username || !this.password) {
      throw new Error("Spond credentials not configured");
    }

    const res = await fetch(`${SPOND_API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.username,
        password: this.password,
      }),
    });

    if (!res.ok) {
      throw new Error(`Spond auth failed: ${res.status}`);
    }

    const data = await res.json() as { loginToken: string };
    cachedToken = {
      token: data.loginToken,
      expiresAt: Date.now() + 3600_000, // 1 hour
    };

    return cachedToken.token;
  }

  private async request<T>(path: string): Promise<T> {
    const token = await this.authenticate();
    const res = await fetch(`${SPOND_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`Spond API error: ${res.status} ${path}`);
    }

    return res.json() as Promise<T>;
  }

  async getGroupMembers(groupId: string) {
    const groups = await this.request<
      Array<{
        id: string;
        name: string;
        members: Array<{
          id: string;
          firstName: string;
          lastName: string;
          profile?: { id: string; imageUrl?: string };
          imageUrl?: string;
        }>;
      }>
    >("/groups");

    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      throw new Error(`Spond group ${groupId} not found. Available: ${groups.map((g) => `${g.name} (${g.id})`).join(", ")}`);
    }

    return group.members.map((m) => {
      let profilePicture: string | null = m.profile?.imageUrl ?? m.imageUrl ?? null;
      // Strip query params that can cause issues
      if (profilePicture && profilePicture.includes("?")) {
        profilePicture = profilePicture.split("?")[0] ?? profilePicture;
      }
      return {
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        profilePicture,
      };
    });
  }

  async getEvents(groupId: string, daysBack = 60) {
    const minStart = new Date(Date.now() - daysBack * 86400_000);
    const minStartStr = minStart.toISOString().split("T")[0] + "T00:00:00.000Z";
    const params = new URLSearchParams({
      groupId,
      minStartTimestamp: minStartStr,
      max: "100",
      scheduled: "true",
    });
    const events = await this.request<
      Array<{
        id: string;
        heading: string;
        startTimestamp: string;
        type: string;
        responses?: {
          acceptedIds?: string[];
          declinedIds?: string[];
          unansweredIds?: string[];
          waitinglistIds?: string[];
        };
      }>
    >(`/sponds/?${params.toString()}`);

    return events;
  }

  async getNextEvents(groupId: string): Promise<{
    training: { heading: string; startTimestamp: string; acceptedIds: string[] } | null;
    match: { heading: string; startTimestamp: string; acceptedIds: string[] } | null;
  }> {
    const now = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
    const params = new URLSearchParams({
      groupId,
      minStartTimestamp: now,
      max: "30",
      scheduled: "true",
    });
    const events = await this.request<
      Array<{
        id: string;
        heading: string;
        startTimestamp: string;
        type: string;
        responses?: {
          acceptedIds?: string[];
        };
      }>
    >(`/sponds/?${params.toString()}`);

    if (!events || events.length === 0) return { training: null, match: null };

    // Sort by startTimestamp ascending to find the nearest upcoming events
    const sorted = events.sort(
      (a, b) => new Date(a.startTimestamp).getTime() - new Date(b.startTimestamp).getTime()
    );

    // RECURRING = training, EVENT = match
    const nextTraining = sorted.find((e) => e.type === "RECURRING");
    const nextMatch = sorted.find((e) => e.type === "EVENT");

    return {
      training: nextTraining
        ? { heading: nextTraining.heading, startTimestamp: nextTraining.startTimestamp, acceptedIds: nextTraining.responses?.acceptedIds ?? [] }
        : null,
      match: nextMatch
        ? { heading: nextMatch.heading, startTimestamp: nextMatch.startTimestamp, acceptedIds: nextMatch.responses?.acceptedIds ?? [] }
        : null,
    };
  }
}
