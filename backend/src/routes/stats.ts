import { Hono } from "hono";
import { getDb } from "../lib/db";

const stats = new Hono();

stats.get("/dashboard", (c) => {
  const db = getDb();

  // Player stats for charts
  const playerStats = db.query(`
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
    GROUP BY p.id
  `).all() as any[];

  // Fine stats
  const fineStats = db.query(`
    SELECT
      p.id,
      p.display_name,
      COALESCE(SUM(f.amount), 0) as total_fines,
      COALESCE(SUM(CASE WHEN f.paid = 1 THEN f.amount ELSE 0 END), 0) as paid,
      COALESCE(SUM(CASE WHEN f.paid = 0 THEN f.amount ELSE 0 END), 0) as unpaid
    FROM players p
    LEFT JOIN fines f ON p.id = f.player_id
    WHERE p.active = 1
    GROUP BY p.id
  `).all() as any[];

  // Fine breakdown by type
  const fineByType = db.query(`
    SELECT ft.name, SUM(f.amount) as total
    FROM fines f
    JOIN fine_types ft ON f.fine_type_id = ft.id
    GROUP BY ft.id
    ORDER BY total DESC
  `).all() as any[];

  // Top 3 calculations
  const sortedByWins = [...playerStats].sort((a, b) => b.wins - a.wins);
  const sortedByWinRate = [...playerStats]
    .filter((p) => p.matches > 0)
    .sort((a, b) => (b.wins / b.matches) - (a.wins / a.matches));
  const sortedByFines = [...fineStats].sort((a, b) => b.total_fines - a.total_fines);

  // Totals
  const totalPlayers = playerStats.length;
  const totalFines = fineStats.reduce((s: number, f: any) => s + f.total_fines, 0);
  const totalPaid = fineStats.reduce((s: number, f: any) => s + f.paid, 0);

  return c.json({
    top3: {
      mostWins: sortedByWins.slice(0, 3).map((p) => ({
        displayName: p.display_name,
        profilePicture: p.profile_picture,
        value: p.wins,
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
        value: p.total_fines,
        label: `${p.total_fines} kr`,
      })),
    },
    trainingChart: playerStats.map((p) => ({
      name: p.display_name,
      wins: p.wins,
      losses: p.losses,
      winRate: p.matches > 0 ? Math.round((p.wins / p.matches) * 100) : 50,
    })),
    fineChart: fineStats.map((p) => ({
      name: p.display_name,
      paid: p.paid,
      unpaid: p.unpaid,
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
