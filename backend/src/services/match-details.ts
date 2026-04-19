import { sql } from "../lib/db";
import { scrapeTeamMatches, type DbuTeamMatch } from "./dbu";

const OUR_TEAM_NAME = "BK Skjold";

interface MatchDetails {
  match: {
    dbuMatchId: string;
    date: string;
    time: string | null;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    venue: string | null;
    locationName: string | null;
    locationAddress: string | null;
    isHome: boolean;
    opponent: string;
  };
  headToHead: {
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    result: "W" | "D" | "L" | null;
  }[];
  opponentSeason: {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    recentForm: ("W" | "D" | "L")[];
  } | null;
  commonOpponents: {
    opponent: string;
    ourResult: string;
    ourScore: string;
    theirResult: string;
    theirScore: string;
  }[];
}

export async function getMatchDetails(dbuMatchId: string): Promise<MatchDetails | null> {
  // 1. Find the match in dbu_team_matches
  const [matchRow] = (await sql`
    SELECT * FROM dbu_team_matches WHERE dbu_match_id = ${dbuMatchId}
  `) as any[];

  if (!matchRow) {
    // Try dbu_matches as fallback
    const [dbuMatch] = (await sql`
      SELECT * FROM dbu_matches WHERE dbu_match_id = ${dbuMatchId}
    `) as any[];
    if (!dbuMatch) return null;

    // Minimal match info from dbu_matches
    const isHome = dbuMatch.home_team === OUR_TEAM_NAME;
    const opponent = isHome ? dbuMatch.away_team : dbuMatch.home_team;
    return {
      match: {
        dbuMatchId,
        date: dbuMatch.date,
        time: null,
        homeTeam: dbuMatch.home_team,
        awayTeam: dbuMatch.away_team,
        homeScore: dbuMatch.home_score,
        awayScore: dbuMatch.away_score,
        venue: null,
        locationName: null,
        locationAddress: null,
        isHome,
        opponent,
      },
      headToHead: await getHeadToHead(opponent),
      opponentSeason: null,
      commonOpponents: [],
    };
  }

  const isHome = matchRow.home_team === OUR_TEAM_NAME;
  const opponent = isHome ? matchRow.away_team : matchRow.home_team;
  const opponentTeamId = isHome ? matchRow.away_team_id : matchRow.home_team_id;

  // Try to find Spond event data for location enrichment
  const spondData = await findSpondEvent(matchRow.date);

  // 2. Head-to-head from our team matches
  const h2h = await getHeadToHead(opponent);

  // 3. Opponent season record
  const opponentSeason = opponentTeamId
    ? await getOpponentSeason(opponentTeamId, opponent)
    : null;

  // 4. Common opponents
  const commonOpponents = opponentTeamId
    ? await getCommonOpponents(opponentTeamId, opponent)
    : [];

  return {
    match: {
      dbuMatchId,
      date: matchRow.date,
      time: matchRow.time || null,
      homeTeam: matchRow.home_team,
      awayTeam: matchRow.away_team,
      homeScore: matchRow.home_score,
      awayScore: matchRow.away_score,
      venue: matchRow.venue || null,
      locationName: spondData?.location_name || null,
      locationAddress: spondData?.location_address || null,
      isHome,
      opponent,
    },
    headToHead: h2h,
    opponentSeason,
    commonOpponents,
  };
}

async function getHeadToHead(opponent: string) {
  // Get all matches between us and this opponent
  const rows = (await sql`
    SELECT date, home_team, away_team, home_score, away_score
    FROM dbu_team_matches
    WHERE (home_team = ${OUR_TEAM_NAME} AND away_team = ${opponent})
       OR (away_team = ${OUR_TEAM_NAME} AND home_team = ${opponent})
    ORDER BY date DESC
  `) as any[];

  return rows.map((r: any) => {
    let result: "W" | "D" | "L" | null = null;
    if (r.home_score !== null && r.away_score !== null) {
      const weAreHome = r.home_team === OUR_TEAM_NAME;
      const ourGoals = weAreHome ? r.home_score : r.away_score;
      const theirGoals = weAreHome ? r.away_score : r.home_score;
      if (ourGoals > theirGoals) result = "W";
      else if (ourGoals < theirGoals) result = "L";
      else result = "D";
    }
    return {
      date: r.date,
      homeTeam: r.home_team,
      awayTeam: r.away_team,
      homeScore: r.home_score,
      awayScore: r.away_score,
      result,
    };
  });
}

async function getOpponentSeason(
  opponentTeamId: string,
  opponentName: string,
): Promise<MatchDetails["opponentSeason"]> {
  // Try DB first, then scrape
  let matches = (await sql`
    SELECT * FROM dbu_team_matches
    WHERE team_id = ${opponentTeamId}
    ORDER BY date DESC
  `) as any[];

  if (matches.length === 0) {
    // Try scraping
    try {
      const scraped = await scrapeTeamMatches(opponentTeamId);
      // Persist
      for (const tm of scraped) {
        await sql`
          INSERT INTO dbu_team_matches (dbu_match_id, team_id, date, time, home_team, home_team_id, away_team, away_team_id, home_score, away_score, venue)
          VALUES (${tm.dbuMatchId}, ${opponentTeamId}, ${tm.date}, ${tm.time}, ${tm.homeTeam}, ${tm.homeTeamId}, ${tm.awayTeam}, ${tm.awayTeamId}, ${tm.homeScore}, ${tm.awayScore}, ${tm.venue})
          ON CONFLICT (dbu_match_id) DO UPDATE SET
            home_score = EXCLUDED.home_score,
            away_score = EXCLUDED.away_score,
            venue = EXCLUDED.venue,
            synced_at = NOW()
        `;
      }
      matches = scraped.map((tm) => ({
        home_team: tm.homeTeam,
        away_team: tm.awayTeam,
        home_score: tm.homeScore,
        away_score: tm.awayScore,
        date: tm.date,
      }));
    } catch {
      return null;
    }
  }

  let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
  const recentForm: ("W" | "D" | "L")[] = [];

  // Only count completed matches
  const completed = matches.filter((m: any) => m.home_score !== null && m.away_score !== null);

  for (const m of completed) {
    const isHome = m.home_team === opponentName;
    const gf = isHome ? m.home_score : m.away_score;
    const ga = isHome ? m.away_score : m.home_score;
    goalsFor += gf;
    goalsAgainst += ga;

    if (gf > ga) { wins++; recentForm.push("W"); }
    else if (gf < ga) { losses++; recentForm.push("L"); }
    else { draws++; recentForm.push("D"); }
  }

  return {
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    recentForm: recentForm.slice(0, 5), // last 5 already sorted by date DESC
  };
}

async function getCommonOpponents(
  opponentTeamId: string,
  opponentName: string,
) {
  // Get our matches
  const ourTeamId = process.env.DBU_TEAM_ID;
  const ourMatches = (await sql`
    SELECT home_team, away_team, home_score, away_score
    FROM dbu_team_matches
    WHERE team_id = ${ourTeamId || ""}
      AND home_score IS NOT NULL AND away_score IS NOT NULL
  `) as any[];

  // Get opponent matches
  let opponentMatches = (await sql`
    SELECT home_team, away_team, home_score, away_score
    FROM dbu_team_matches
    WHERE team_id = ${opponentTeamId}
      AND home_score IS NOT NULL AND away_score IS NOT NULL
  `) as any[];

  if (opponentMatches.length === 0) {
    // Try scraping
    try {
      const scraped = await scrapeTeamMatches(opponentTeamId);
      for (const tm of scraped) {
        await sql`
          INSERT INTO dbu_team_matches (dbu_match_id, team_id, date, time, home_team, home_team_id, away_team, away_team_id, home_score, away_score, venue)
          VALUES (${tm.dbuMatchId}, ${opponentTeamId}, ${tm.date}, ${tm.time}, ${tm.homeTeam}, ${tm.homeTeamId}, ${tm.awayTeam}, ${tm.awayTeamId}, ${tm.homeScore}, ${tm.awayScore}, ${tm.venue})
          ON CONFLICT (dbu_match_id) DO UPDATE SET
            home_score = EXCLUDED.home_score,
            away_score = EXCLUDED.away_score,
            venue = EXCLUDED.venue,
            synced_at = NOW()
        `;
      }
      opponentMatches = scraped
        .filter((tm) => tm.homeScore !== null && tm.awayScore !== null)
        .map((tm) => ({
          home_team: tm.homeTeam,
          away_team: tm.awayTeam,
          home_score: tm.homeScore,
          away_score: tm.awayScore,
        }));
    } catch {
      return [];
    }
  }

  // Build sets of opponents each team has faced
  const ourOpponents = new Map<string, { result: "W" | "D" | "L"; score: string }>();
  for (const m of ourMatches) {
    const weAreHome = m.home_team === OUR_TEAM_NAME;
    const opp = weAreHome ? m.away_team : m.home_team;
    const ourGoals = weAreHome ? m.home_score : m.away_score;
    const theirGoals = weAreHome ? m.away_score : m.home_score;
    if (opp === opponentName) continue; // skip the opponent itself

    const result = ourGoals > theirGoals ? "W" : ourGoals < theirGoals ? "L" : "D";
    // Use latest result (matches are already ordered)
    if (!ourOpponents.has(opp)) {
      ourOpponents.set(opp, { result, score: `${ourGoals}-${theirGoals}` });
    }
  }

  const theirOpponents = new Map<string, { result: "W" | "D" | "L"; score: string }>();
  for (const m of opponentMatches) {
    const theyAreHome = m.home_team === opponentName;
    const opp = theyAreHome ? m.away_team : m.home_team;
    const theirGoals = theyAreHome ? m.home_score : m.away_score;
    const oppGoals = theyAreHome ? m.away_score : m.home_score;
    if (opp === OUR_TEAM_NAME) continue; // skip us

    const result = theirGoals > oppGoals ? "W" : theirGoals < oppGoals ? "L" : "D";
    if (!theirOpponents.has(opp)) {
      theirOpponents.set(opp, { result, score: `${theirGoals}-${oppGoals}` });
    }
  }

  // Find intersection
  const common: MatchDetails["commonOpponents"] = [];
  for (const [opp, ours] of ourOpponents) {
    const theirs = theirOpponents.get(opp);
    if (theirs) {
      common.push({
        opponent: opp,
        ourResult: ours.result,
        ourScore: ours.score,
        theirResult: theirs.result,
        theirScore: theirs.score,
      });
    }
  }

  return common;
}

async function findSpondEvent(matchDate: string) {
  // Try to find a Spond event on the same date
  const rows = (await sql`
    SELECT location_name, location_address, start_time, end_time
    FROM spond_events
    WHERE start_time LIKE ${matchDate + '%'}
    LIMIT 1
  `) as any[];
  return rows[0] || null;
}
