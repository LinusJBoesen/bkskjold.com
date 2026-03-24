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
    const group = await this.request<{
      members: Array<{
        id: string;
        firstName: string;
        lastName: string;
        profile?: { id: string };
      }>;
    }>(`/groups/${groupId}`);

    return group.members.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      profileId: m.profile?.id,
    }));
  }

  async getEvents(groupId: string, daysBack = 30) {
    const minDate = new Date(Date.now() - daysBack * 86400_000).toISOString();
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
    >(`/sponds?groupId=${groupId}&minDate=${minDate}&includeComments=false&maxEvents=100`);

    return events;
  }

  async getNextTrainingAccepted(groupId: string): Promise<string[]> {
    const now = new Date().toISOString();
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
    >(`/sponds?groupId=${groupId}&minDate=${now}&maxEvents=1`);

    if (events.length === 0) return [];
    return events[0].responses?.acceptedIds || [];
  }
}
