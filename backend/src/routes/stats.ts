import { Hono } from "hono";
import { sql } from "../lib/db";

const stats = new Hono();

stats.get("/dashboard", async (c) => {
  // Player stats for charts
  const playerStats = await sql`
    SELECT
      p.id,
      p.display_name,
      p.profile_picture,
      COUNT(CASE WHEN m.status = 'completed' THEN 1 END) as matches,
      COALESCE(SUM(CASE WHEN m.winning_team = mp.team THEN 1 ELSE 0 END), 0) as wins,
      COALESCE(SUM(CASE WHEN m.winning_team IS NOT NULL AND m.winning_team != mp.team THEN 1 ELSE 0 END), 0) as losses
    FROM players p
    LEFT JOIN match_players mp ON p.id = mp.player_id
    LEFT JOIN matches m ON mp.match_id = m.id
    WHERE p.active = 1
    GROUP BY p.id, p.display_name, p.profile_picture
  ` as any[];

  // Fine stats
  const fineStats = await sql`
    SELECT
      p.id,
      p.display_name,
      COALESCE(SUM(f.amount), 0) as total_fines,
      COALESCE(SUM(CASE WHEN f.paid = 1 THEN f.amount ELSE 0 END), 0) as paid,
      COALESCE(SUM(CASE WHEN f.paid = 0 THEN f.amount ELSE 0 END), 0) as unpaid
    FROM players p
    LEFT JOIN fines f ON p.id = f.player_id
    WHERE p.active = 1
    GROUP BY p.id, p.display_name
  ` as any[];

  // Fine breakdown by type
  const fineByType = (await sql`
    SELECT ft.name, SUM(f.amount) as total
    FROM fines f
    JOIN fine_types ft ON f.fine_type_id = ft.id
    GROUP BY ft.id, ft.name
    ORDER BY total DESC
  ` as any[]).map((r: any) => ({ ...r, total: Number(r.total) }));

  // Top 3 calculations
  const sortedByWins = [...playerStats].sort((a, b) => b.wins - a.wins);
  const sortedByWinRate = [...playerStats]
    .filter((p) => p.matches > 0)
    .sort((a, b) => (b.wins / b.matches) - (a.wins / a.matches));
  const sortedByFines = [...fineStats].sort((a, b) => b.total_fines - a.total_fines);

  // Totals
  const totalPlayers = playerStats.length;
  const totalFines = fineStats.reduce((s: number, f: any) => s + Number(f.total_fines), 0);
  const totalPaid = fineStats.reduce((s: number, f: any) => s + Number(f.paid), 0);

  return c.json({
    top3: {
      mostWins: sortedByWins.slice(0, 3).map((p) => ({
        displayName: p.display_name,
        profilePicture: p.profile_picture,
        value: Number(p.wins),
        label: `${p.wins} sejre`,
      })),
      bestWinRate: sortedByWinRate.slice(0, 3).map((p) => ({
        displayName: p.display_name,
        profilePicture: p.profile_picture,
        value: Math.round((p.wins / p.matches) * 100),
        label: `${Math.round((p.wins / p.matches) * 100)}%`,
      })),
      highestFines: sortedByFines.slice(0, 3).map((p) => ({
        displayName: p.display_name,
        value: Number(p.total_fines),
        label: `${p.total_fines} kr`,
      })),
    },
    trainingChart: playerStats.map((p) => ({
      name: p.display_name,
      wins: Number(p.wins),
      losses: Number(p.losses),
      winRate: p.matches > 0 ? Math.round((p.wins / p.matches) * 100) : 50,
    })),
    fineChart: fineStats.map((p) => ({
      name: p.display_name,
      paid: Number(p.paid),
      unpaid: Number(p.unpaid),
    })),
    fineByType,
    totals: {
      players: totalPlayers,
      totalFines,
      paidFines: totalPaid,
    },
  });
});

export default stats;
