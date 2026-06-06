import { Hono } from "hono";
import { sql } from "../lib/db";
import { requireRole } from "../middleware/auth";
import { randomUUID } from "crypto";

const app = new Hono();

interface CandidateInput {
  playerId?: string;
  fanId?: string;
}

// Returns 403 response if the current non-admin user lacks karinger_access. Returns null when allowed.
async function checkAccess(c: any): Promise<Response | null> {
  const session = c.get("session" as never) as { userId: string; role: string };
  if (session.role === "admin") return null;
  const [user] = await sql`SELECT karinger_access FROM users WHERE id = ${session.userId}` as any[];
  if (!user?.karinger_access) {
    return c.json({ error: "Du har ikke adgang til kåringer" }, 403);
  }
  return null;
}

async function loadCandidates(awardIds: string[]) {
  const byAward = new Map<string, any[]>();
  if (awardIds.length === 0) return byAward;
  const rows = await sql`
    SELECT ac.id, ac.award_id,
      CASE WHEN ac.player_id IS NOT NULL THEN 'player' ELSE 'fan' END AS type,
      COALESCE(p.display_name, f.name) AS name,
      p.profile_picture AS profile_picture
    FROM award_candidates ac
    LEFT JOIN players p ON p.id = ac.player_id
    LEFT JOIN fan_signups f ON f.id = ac.fan_id
    WHERE ac.award_id = ANY(${sql.array(awardIds, 'TEXT')})
    ORDER BY name
  ` as any[];
  for (const r of rows) {
    if (!byAward.has(r.award_id)) byAward.set(r.award_id, []);
    byAward.get(r.award_id)!.push({
      id: r.id,
      type: r.type,
      name: r.name,
      profilePicture: r.profile_picture,
    });
  }
  return byAward;
}

// GET /api/awards — list awards visible to the current user
app.get("/", async (c) => {
  const blocked = await checkAccess(c);
  if (blocked) return blocked;
  const session = c.get("session" as never) as { userId: string; role: string };
  const isAdmin = session.role === "admin";

  const awards = (isAdmin
    ? await sql`SELECT id, title, description, status, suggested_by_user_id, created_at, revealed_at FROM awards ORDER BY created_at DESC`
    : await sql`SELECT id, title, description, status, suggested_by_user_id, created_at, revealed_at FROM awards WHERE status IN ('open', 'revealed') ORDER BY created_at DESC`
  ) as any[];

  const awardIds = awards.map((a) => a.id);
  const candidatesByAward = await loadCandidates(awardIds);

  const votes = awardIds.length > 0
    ? await sql`SELECT award_id, candidate_id FROM award_votes WHERE voter_user_id = ${session.userId} AND award_id = ANY(${sql.array(awardIds, 'TEXT')})` as any[]
    : [];
  const myVoteByAward = new Map<string, string>();
  for (const v of votes) myVoteByAward.set(v.award_id, v.candidate_id);

  // Vote counts visible to admin on every award. Non-admin viewers never see
  // per-candidate counts; on revealed awards they only see the winner(s).
  const countsByCandidate = new Map<string, number>();
  if (isAdmin && awardIds.length > 0) {
    const counts = await sql`
      SELECT candidate_id, COUNT(*)::int AS n
      FROM award_votes
      WHERE award_id = ANY(${sql.array(awardIds, 'TEXT')})
      GROUP BY candidate_id
    ` as any[];
    for (const r of counts) countsByCandidate.set(r.candidate_id, Number(r.n));
  }

  // For non-admin viewers, compute the winner candidate(s) per revealed award —
  // highest vote count (ties allowed) — so we can show "winner only" instead
  // of the full breakdown.
  const winnersByAward = new Map<string, Set<string>>();
  if (!isAdmin) {
    const revealedIds = awards.filter((a) => a.status === "revealed").map((a) => a.id);
    if (revealedIds.length > 0) {
      const winners = await sql`
        WITH counts AS (
          SELECT award_id, candidate_id, COUNT(*)::int AS n
          FROM award_votes
          WHERE award_id = ANY(${sql.array(revealedIds, 'TEXT')})
          GROUP BY award_id, candidate_id
        ),
        maxes AS (SELECT award_id, MAX(n) AS max_n FROM counts GROUP BY award_id)
        SELECT c.award_id, c.candidate_id
        FROM counts c JOIN maxes m ON c.award_id = m.award_id AND c.n = m.max_n
      ` as any[];
      for (const w of winners) {
        if (!winnersByAward.has(w.award_id)) winnersByAward.set(w.award_id, new Set());
        winnersByAward.get(w.award_id)!.add(w.candidate_id);
      }
    }
  }

  return c.json(awards.map((a) => {
    const allCandidates = candidatesByAward.get(a.id) || [];
    let candidates;
    if (isAdmin) {
      candidates = allCandidates.map((cand) => ({
        ...cand,
        voteCount: countsByCandidate.has(cand.id) ? countsByCandidate.get(cand.id) : 0,
      }));
    } else if (a.status === "revealed") {
      const winnerIds = winnersByAward.get(a.id) ?? new Set();
      // Filter to winner(s); counts hidden — non-admin only sees who won.
      candidates = allCandidates
        .filter((cand) => winnerIds.has(cand.id))
        .map((cand) => ({ ...cand, voteCount: null }));
    } else {
      candidates = allCandidates.map((cand) => ({ ...cand, voteCount: null }));
    }
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      status: a.status,
      suggestedByUserId: a.suggested_by_user_id,
      createdAt: a.created_at,
      revealedAt: a.revealed_at,
      candidates,
      myVoteCandidateId: myVoteByAward.get(a.id) || null,
    };
  }));
});

// POST /api/awards/suggest — admin + spiller (fans cannot suggest)
app.post("/suggest", requireRole("admin", "spiller"), async (c) => {
  const blocked = await checkAccess(c);
  if (blocked) return blocked;
  const session = c.get("session" as never) as { userId: string };
  const body = await c.req.json<{ title: string; description?: string }>();
  if (!body.title || !body.title.trim()) {
    return c.json({ error: "Titel er påkrævet" }, 400);
  }
  const id = randomUUID();
  await sql`
    INSERT INTO awards (id, title, description, status, suggested_by_user_id)
    VALUES (${id}, ${body.title.trim()}, ${body.description?.trim() || null}, 'suggested', ${session.userId})
  `;
  return c.json({ id }, 201);
});

// GET /api/awards/access — admin: list spiller+fan users with their access flag
app.get("/access", requireRole("admin"), async (c) => {
  const rows = await sql`
    SELECT id, name, email, role, karinger_access
    FROM users
    WHERE role IN ('spiller', 'fan') AND approved = 1
    ORDER BY role, name
  ` as any[];
  return c.json(rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    karingerAccess: !!r.karinger_access,
  })));
});

// PUT /api/awards/access — admin: set the full invite list (everyone not in the list loses access)
app.put("/access", requireRole("admin"), async (c) => {
  const body = await c.req.json<{ allowedUserIds: string[] }>();
  if (!Array.isArray(body.allowedUserIds)) {
    return c.json({ error: "allowedUserIds skal være en liste" }, 400);
  }
  await sql.begin(async (tx) => {
    await tx`UPDATE users SET karinger_access = 0 WHERE role IN ('spiller', 'fan')`;
    if (body.allowedUserIds.length > 0) {
      await tx`UPDATE users SET karinger_access = 1 WHERE id = ANY(${sql.array(body.allowedUserIds, 'TEXT')})`;
    }
  });
  return c.json({ success: true });
});

// POST /api/awards/:id/candidates — admin: additive add of candidates to an open kåring
// Lets us add late entries (new player/fan joins after voting opened) without resetting votes.
app.post("/:id/candidates", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ candidates: CandidateInput[] }>();
  if (!Array.isArray(body.candidates) || body.candidates.length === 0) {
    return c.json({ error: "Mindst én kandidat påkrævet" }, 400);
  }
  for (const cand of body.candidates) {
    if (!!cand.playerId === !!cand.fanId) {
      return c.json({ error: "Hver kandidat skal være enten en spiller eller en fan" }, 400);
    }
  }
  const [award] = await sql`SELECT status FROM awards WHERE id = ${id}` as any[];
  if (!award) return c.json({ error: "Kåring ikke fundet" }, 404);
  if (award.status === "revealed") {
    return c.json({ error: "Kan ikke ændre kandidater efter afsløring" }, 400);
  }
  // ON CONFLICT DO NOTHING via the UNIQUE partial indexes — silently skips duplicates.
  let added = 0;
  await sql.begin(async (tx) => {
    for (const cand of body.candidates) {
      const res = await tx`INSERT INTO award_candidates (id, award_id, player_id, fan_id)
        VALUES (${randomUUID()}, ${id}, ${cand.playerId || null}, ${cand.fanId || null})
        ON CONFLICT DO NOTHING`;
      if (res.count > 0) added++;
    }
  });
  return c.json({ success: true, added });
});

// POST /api/awards/:id/open — admin: replace candidates and flip status to 'open'
app.post("/:id/open", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ title?: string; description?: string; candidates: CandidateInput[] }>();
  if (!Array.isArray(body.candidates) || body.candidates.length < 2) {
    return c.json({ error: "Vælg mindst 2 kandidater" }, 400);
  }
  for (const cand of body.candidates) {
    if (!!cand.playerId === !!cand.fanId) {
      return c.json({ error: "Hver kandidat skal være enten en spiller eller en fan" }, 400);
    }
  }
  const [exists] = await sql`SELECT id FROM awards WHERE id = ${id}` as any[];
  if (!exists) return c.json({ error: "Kåring ikke fundet" }, 404);

  await sql.begin(async (tx) => {
    if (body.title?.trim()) await tx`UPDATE awards SET title = ${body.title.trim()} WHERE id = ${id}`;
    if (body.description !== undefined) await tx`UPDATE awards SET description = ${body.description.trim() || null} WHERE id = ${id}`;
    await tx`DELETE FROM award_votes WHERE award_id = ${id}`;
    await tx`DELETE FROM award_candidates WHERE award_id = ${id}`;
    for (const cand of body.candidates) {
      await tx`INSERT INTO award_candidates (id, award_id, player_id, fan_id)
        VALUES (${randomUUID()}, ${id}, ${cand.playerId || null}, ${cand.fanId || null})`;
    }
    await tx`UPDATE awards SET status = 'open', revealed_at = NULL WHERE id = ${id}`;
  });
  return c.json({ success: true });
});

// POST /api/awards/create — admin shortcut: create directly as 'open' with candidates
app.post("/create", requireRole("admin"), async (c) => {
  const session = c.get("session" as never) as { userId: string };
  const body = await c.req.json<{ title: string; description?: string; candidates: CandidateInput[] }>();
  if (!body.title?.trim()) return c.json({ error: "Titel er påkrævet" }, 400);
  if (!Array.isArray(body.candidates) || body.candidates.length < 2) {
    return c.json({ error: "Vælg mindst 2 kandidater" }, 400);
  }
  for (const cand of body.candidates) {
    if (!!cand.playerId === !!cand.fanId) {
      return c.json({ error: "Hver kandidat skal være enten en spiller eller en fan" }, 400);
    }
  }
  const id = randomUUID();
  await sql.begin(async (tx) => {
    await tx`INSERT INTO awards (id, title, description, status, suggested_by_user_id)
      VALUES (${id}, ${body.title.trim()}, ${body.description?.trim() || null}, 'open', ${session.userId})`;
    for (const cand of body.candidates) {
      await tx`INSERT INTO award_candidates (id, award_id, player_id, fan_id)
        VALUES (${randomUUID()}, ${id}, ${cand.playerId || null}, ${cand.fanId || null})`;
    }
  });
  return c.json({ id }, 201);
});

// POST /api/awards/:id/vote — any logged-in user with karinger_access; first-vote-wins
app.post("/:id/vote", async (c) => {
  const blocked = await checkAccess(c);
  if (blocked) return blocked;
  const id = c.req.param("id");
  const session = c.get("session" as never) as { userId: string };
  const body = await c.req.json<{ candidateId: string }>();
  if (!body.candidateId) return c.json({ error: "candidateId er påkrævet" }, 400);

  const [award] = await sql`SELECT status FROM awards WHERE id = ${id}` as any[];
  if (!award) return c.json({ error: "Kåring ikke fundet" }, 404);
  if (award.status !== "open") return c.json({ error: "Afstemningen er ikke åben" }, 400);

  const [cand] = await sql`SELECT id FROM award_candidates WHERE id = ${body.candidateId} AND award_id = ${id}` as any[];
  if (!cand) return c.json({ error: "Ugyldig kandidat" }, 400);

  // First-vote-wins: once a user has voted on an award, they can't change it
  // until the admin reveals (and the award goes read-only for everyone).
  const result = await sql`
    INSERT INTO award_votes (award_id, voter_user_id, candidate_id)
    VALUES (${id}, ${session.userId}, ${body.candidateId})
    ON CONFLICT (award_id, voter_user_id) DO NOTHING
  `;
  if (result.count === 0) {
    return c.json({ error: "Du har allerede stemt på denne kåring" }, 409);
  }
  return c.json({ success: true });
});

// POST /api/awards/:id/reveal — admin: close voting and show counts to everyone
app.post("/:id/reveal", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  const result = await sql`UPDATE awards SET status = 'revealed', revealed_at = NOW() WHERE id = ${id} AND status = 'open'`;
  if (result.count === 0) {
    return c.json({ error: "Kåring findes ikke eller er ikke åben" }, 400);
  }
  return c.json({ success: true });
});

// DELETE /api/awards/:id — admin only
app.delete("/:id", requireRole("admin"), async (c) => {
  const id = c.req.param("id");
  await sql`DELETE FROM awards WHERE id = ${id}`;
  return c.json({ success: true });
});

export default app;
