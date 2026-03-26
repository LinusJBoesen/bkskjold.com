import { sql } from "../lib/db";

interface PlayerStats {
  id: string;
  displayName: string;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface TeamResult {
  team1: PlayerStats[];
  team2: PlayerStats[];
  balance: {
    team1Strength: number;
    team2Strength: number;
    difference: number;
    balancePercent: number;
  };
}

export async function calculatePlayerStats(): Promise<PlayerStats[]> {
  const rows = await sql`
    SELECT
      p.id,
      p.display_name,
      COUNT(mp.match_id) as matches,
      COALESCE(SUM(CASE WHEN m.winning_team = mp.team THEN 1 ELSE 0 END), 0) as wins,
      COALESCE(SUM(CASE WHEN m.winning_team IS NOT NULL AND m.winning_team != mp.team THEN 1 ELSE 0 END), 0) as losses
    FROM players p
    LEFT JOIN match_players mp ON p.id = mp.player_id
    LEFT JOIN matches m ON mp.match_id = m.id AND m.status = 'completed'
    WHERE p.active = 1
    GROUP BY p.id, p.display_name
  ` as Array<{
    id: string;
    display_name: string;
    matches: number;
    wins: number;
    losses: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    displayName: r.display_name,
    matches: Number(r.matches) || 0,
    wins: Number(r.wins) || 0,
    losses: Number(r.losses) || 0,
    winRate: Number(r.matches) > 0 ? Number(r.wins) / Number(r.matches) : 0.5,
  }));
}

export function getPlayerWinRate(stats: PlayerStats[], playerId: string): number {
  const player = stats.find((s) => s.id === playerId);
  return player?.winRate ?? 0.5;
}

function getTeamBalance(team1: PlayerStats[], team2: PlayerStats[]) {
  const t1Strength = team1.reduce((sum, p) => sum + p.winRate, 0) / (team1.length || 1);
  const t2Strength = team2.reduce((sum, p) => sum + p.winRate, 0) / (team2.length || 1);
  const diff = Math.abs(t1Strength - t2Strength);
  const maxStrength = Math.max(t1Strength, t2Strength, 0.001);
  const balancePercent = Math.round((1 - diff / maxStrength) * 100);

  return {
    team1Strength: Math.round(t1Strength * 100) / 100,
    team2Strength: Math.round(t2Strength * 100) / 100,
    difference: Math.round(diff * 1000) / 1000,
    balancePercent,
  };
}

function greedy(players: PlayerStats[]): TeamResult {
  const sorted = [...players].sort((a, b) => b.winRate - a.winRate);
  const team1: PlayerStats[] = [];
  const team2: PlayerStats[] = [];

  for (const player of sorted) {
    const t1Sum = team1.reduce((s, p) => s + p.winRate, 0);
    const t2Sum = team2.reduce((s, p) => s + p.winRate, 0);

    if (t1Sum <= t2Sum && team1.length <= team2.length) {
      team1.push(player);
    } else {
      team2.push(player);
    }
  }

  return { team1, team2, balance: getTeamBalance(team1, team2) };
}

function optimal(players: PlayerStats[]): TeamResult {
  if (players.length <= 1) {
    return { team1: players, team2: [], balance: getTeamBalance(players, []) };
  }

  const halfSize = Math.floor(players.length / 2);
  let bestResult: TeamResult | null = null;
  let bestDiff = Infinity;

  // Sample random combinations (up to 1000 tries)
  const maxIterations = Math.min(1000, Math.pow(2, players.length));

  for (let i = 0; i < maxIterations; i++) {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const t1 = shuffled.slice(0, halfSize);
    const t2 = shuffled.slice(halfSize);
    const balance = getTeamBalance(t1, t2);

    if (balance.difference < bestDiff) {
      bestDiff = balance.difference;
      bestResult = { team1: t1, team2: t2, balance };
    }

    if (bestDiff === 0) break;
  }

  return bestResult!;
}

export async function generateBalancedTeams(
  playerIds: string[],
  algorithm: "greedy" | "optimal" = "greedy"
): Promise<TeamResult> {
  const allStats = await calculatePlayerStats();
  const players = playerIds
    .map((id) => allStats.find((s) => s.id === id))
    .filter((s): s is PlayerStats => s !== undefined);

  // Add guest players (IDs starting with "guest-") with default 0.5 win rate
  for (const id of playerIds) {
    if (id.startsWith("guest-") && !players.find((p) => p.id === id)) {
      players.push({
        id,
        displayName: id.replace("guest-", "Gæst: "),
        matches: 0,
        wins: 0,
        losses: 0,
        winRate: 0.5,
      });
    }
  }

  return algorithm === "greedy" ? greedy(players) : optimal(players);
}

export function swapPlayers(
  team1: PlayerStats[],
  team2: PlayerStats[],
  playerId: string
): TeamResult {
  const inTeam1 = team1.findIndex((p) => p.id === playerId);
  const inTeam2 = team2.findIndex((p) => p.id === playerId);

  const newTeam1 = [...team1];
  const newTeam2 = [...team2];

  if (inTeam1 !== -1) {
    const [player] = newTeam1.splice(inTeam1, 1);
    newTeam2.push(player!);
  } else if (inTeam2 !== -1) {
    const [player] = newTeam2.splice(inTeam2, 1);
    newTeam1.push(player!);
  }

  return { team1: newTeam1, team2: newTeam2, balance: getTeamBalance(newTeam1, newTeam2) };
}
