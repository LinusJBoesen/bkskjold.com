import { Hono } from "hono";
import { sql } from "../lib/db";

const stats = new Hono();

function getStreak(results: string[]): string {
  if (results.length === 0) return "";
  const first = results[0];
  let count = 0;
  for (const r of results) {
    if (r === first) count++;
    else break;
  }
  return `${count}${first}`;
}

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

  // Recent form: last 5 matches per player (W/L)
  const recentForm = (await sql`
    SELECT
      mp.player_id,
      p.display_name,
      p.profile_picture,
      m.id as match_id,
      m.date,
      CASE
        WHEN m.winning_team = mp.team THEN 'W'
        WHEN m.winning_team IS NULL THEN 'D'
        ELSE 'L'
      END as result
    FROM match_players mp
    JOIN matches m ON mp.match_id = m.id
    JOIN players p ON mp.player_id = p.id
    WHERE m.status = 'completed' AND p.active = 1
    ORDER BY m.date DESC
  ` as any[]);

  // Group by player, take last 5
  const formByPlayer: Record<string, { displayName: string; profilePicture?: string; results: string[] }> = {};
  for (const row of recentForm) {
    if (!formByPlayer[row.player_id]) {
      formByPlayer[row.player_id] = {
        displayName: row.display_name,
        profilePicture: row.profile_picture,
        results: [],
      };
    }
    if (formByPlayer[row.player_id].results.length < 5) {
      formByPlayer[row.player_id].results.push(row.result);
    }
  }

  const playerForm = Object.entries(formByPlayer)
    .filter(([_, v]) => v.results.length > 0)
    .map(([id, v]) => ({
      playerId: id,
      displayName: v.displayName,
      profilePicture: v.profilePicture,
      results: v.results,
      streak: getStreak(v.results),
    }))
    .sort((a, b) => {
      const aWins = a.results.filter(r => r === 'W').length;
      const bWins = b.results.filter(r => r === 'W').length;
      return bWins - aWins;
    });

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

  const fanRows = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'fan' AND approved = 1` as any[];
  const totalFans = Number(fanRows[0]?.count ?? 0);

  // Fines trend: total fines accumulated over time (by month)
  const finesTrend = (await sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at::timestamp), 'YYYY-MM') as month,
      SUM(amount) as total
    FROM fines
    GROUP BY DATE_TRUNC('month', created_at::timestamp)
    ORDER BY DATE_TRUNC('month', created_at::timestamp) ASC
  ` as any[]).map((r: any) => ({
    month: r.month,
    total: Number(r.total),
  }));

  // Attendance trend: number of players per match over time
  const attendanceTrend = (await sql`
    SELECT
      m.date,
      COUNT(DISTINCT mp.player_id) as players
    FROM matches m
    JOIN match_players mp ON m.id = mp.match_id
    WHERE m.status = 'completed'
    GROUP BY m.id, m.date
    ORDER BY m.date ASC
  ` as any[]).map((r: any) => ({
    date: r.date,
    players: Number(r.players),
  }));

  // Recent activity: last 10 events across fines, matches, players
  const recentFines = (await sql`
    SELECT
      f.id, f.amount, f.created_at,
      p.display_name as player_name,
      ft.name as fine_name
    FROM fines f
    JOIN players p ON f.player_id = p.id
    JOIN fine_types ft ON f.fine_type_id = ft.id
    ORDER BY f.created_at DESC
    LIMIT 5
  ` as any[]).map((r: any) => ({
    type: "fine" as const,
    id: r.id,
    description: `${r.player_name}: ${r.fine_name} (${r.amount} kr)`,
    date: r.created_at,
  }));

  const recentMatches = (await sql`
    SELECT
      m.id, m.date, m.completed_at,
      COUNT(mp.player_id) as player_count
    FROM matches m
    JOIN match_players mp ON m.id = mp.match_id
    WHERE m.status = 'completed'
    GROUP BY m.id, m.date, m.completed_at
    ORDER BY m.completed_at DESC
    LIMIT 5
  ` as any[]).map((r: any) => ({
    type: "match" as const,
    id: r.id,
    description: `Kamp med ${r.player_count} spillere`,
    date: r.completed_at || r.date,
  }));

  const recentActivity = [...recentFines, ...recentMatches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Total matches count
  const matchCountRows = await sql`SELECT COUNT(*) as count FROM matches WHERE status = 'completed'` as any[];
  const totalMatches = Number(matchCountRows[0]?.count ?? 0);

  // Top contributors from match_events (goals + assists)
  const topContributors = (await sql`
    SELECT
      p.id,
      p.display_name,
      p.profile_picture,
      COALESCE(SUM(CASE WHEN me.event_type = 'goal' THEN 1 ELSE 0 END), 0) as goals,
      COALESCE(SUM(CASE WHEN me.event_type = 'assist' THEN 1 ELSE 0 END), 0) as assists,
      COALESCE(SUM(CASE WHEN me.event_type = 'yellow_card' THEN 1 ELSE 0 END), 0) as yellow_cards,
      COALESCE(SUM(CASE WHEN me.event_type = 'red_card' THEN 1 ELSE 0 END), 0) as red_cards,
      COALESCE(SUM(CASE WHEN me.event_type = 'clean_sheet' THEN 1 ELSE 0 END), 0) as clean_sheets
    FROM players p
    JOIN match_events me ON me.player_id = p.id
    WHERE p.active = 1
    GROUP BY p.id, p.display_name, p.profile_picture
    HAVING COALESCE(SUM(CASE WHEN me.event_type = 'goal' THEN 1 ELSE 0 END), 0) + COALESCE(SUM(CASE WHEN me.event_type = 'assist' THEN 1 ELSE 0 END), 0) > 0
    ORDER BY COALESCE(SUM(CASE WHEN me.event_type = 'goal' THEN 1 ELSE 0 END), 0) + COALESCE(SUM(CASE WHEN me.event_type = 'assist' THEN 1 ELSE 0 END), 0) DESC, COALESCE(SUM(CASE WHEN me.event_type = 'goal' THEN 1 ELSE 0 END), 0) DESC
    LIMIT 10
  ` as any[]).map((r: any) => ({
    id: r.id,
    displayName: r.display_name,
    profilePicture: r.profile_picture,
    goals: Number(r.goals),
    assists: Number(r.assists),
    yellowCards: Number(r.yellow_cards),
    redCards: Number(r.red_cards),
    cleanSheets: Number(r.clean_sheets),
  }));

  // Bødekasse balance
  const [expenseRows, paidFineRows] = await Promise.all([
    sql`SELECT COALESCE(SUM(amount), 0) AS total FROM bodekasse_expenses`,
    sql`SELECT COALESCE(SUM(amount), 0) AS total FROM fines WHERE paid = 1`,
  ]);
  const bodekasse = {
    totalCollected: Number(paidFineRows[0]?.total ?? 0),
    totalSpent: Number(expenseRows[0]?.total ?? 0),
    remaining: Number(paidFineRows[0]?.total ?? 0) - Number(expenseRows[0]?.total ?? 0),
  };

  // Aggregate totals for match events
  const eventTotals = (await sql`
    SELECT
      COALESCE(SUM(CASE WHEN event_type = 'goal' THEN 1 ELSE 0 END), 0) as total_goals,
      COALESCE(SUM(CASE WHEN event_type = 'assist' THEN 1 ELSE 0 END), 0) as total_assists
    FROM match_events
  ` as any[]);
  const totalGoals = Number(eventTotals[0]?.total_goals ?? 0);
  const totalAssists = Number(eventTotals[0]?.total_assists ?? 0);

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
    playerForm,
    attendanceTrend,
    finesTrend,
    recentActivity,
    topContributors,
    bodekasse,
    totals: {
      players: totalPlayers,
      totalFines,
      paidFines: totalPaid,
      fans: totalFans,
      matches: totalMatches,
      goals: totalGoals,
      assists: totalAssists,
    },
  });
});

export default stats;
