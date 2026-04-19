import { test, expect, describe } from "bun:test";

// Test the common opponents logic in isolation (pure functions)
describe("common opponents logic", () => {
  test("finds common opponents and computes results correctly", () => {
    const OUR_TEAM = "BK Skjold";
    const OPPONENT = "Vanløse IF";

    // Simulated our matches
    const ourMatches = [
      { home_team: "BK Skjold", away_team: "FC Nordvest", home_score: 0, away_score: 1 },
      { home_team: "Husum BK", away_team: "BK Skjold", home_score: 1, away_score: 2 },
      { home_team: "BK Skjold", away_team: "Brønshøj BK", home_score: 4, away_score: 0 },
      { home_team: "BK Skjold", away_team: "Nørrebro United", home_score: 2, away_score: 2 },
      { home_team: "BK Skjold", away_team: "Vanløse IF", home_score: 3, away_score: 1 },
    ];

    // Simulated opponent (Vanløse IF) matches
    const opponentMatches = [
      { home_team: "Vanløse IF", away_team: "FC Nordvest", home_score: 1, away_score: 2 },
      { home_team: "Husum BK", away_team: "Vanløse IF", home_score: 0, away_score: 1 },
      { home_team: "Vanløse IF", away_team: "Brønshøj BK", home_score: 3, away_score: 0 },
      { home_team: "Nørrebro United", away_team: "Vanløse IF", home_score: 1, away_score: 1 },
    ];

    // Build our opponents map
    const ourOpponents = new Map<string, { result: string; score: string }>();
    for (const m of ourMatches) {
      const weAreHome = m.home_team === OUR_TEAM;
      const opp = weAreHome ? m.away_team : m.home_team;
      const ourGoals = weAreHome ? m.home_score : m.away_score;
      const theirGoals = weAreHome ? m.away_score : m.home_score;
      if (opp === OPPONENT) continue;
      const result = ourGoals > theirGoals ? "W" : ourGoals < theirGoals ? "L" : "D";
      if (!ourOpponents.has(opp)) {
        ourOpponents.set(opp, { result, score: `${ourGoals}-${theirGoals}` });
      }
    }

    // Build their opponents map
    const theirOpponents = new Map<string, { result: string; score: string }>();
    for (const m of opponentMatches) {
      const theyAreHome = m.home_team === OPPONENT;
      const opp = theyAreHome ? m.away_team : m.home_team;
      const theirGoals = theyAreHome ? m.home_score : m.away_score;
      const oppGoals = theyAreHome ? m.away_score : m.home_score;
      if (opp === OUR_TEAM) continue;
      const result = theirGoals > oppGoals ? "W" : theirGoals < oppGoals ? "L" : "D";
      if (!theirOpponents.has(opp)) {
        theirOpponents.set(opp, { result, score: `${theirGoals}-${oppGoals}` });
      }
    }

    // Find common
    const common: any[] = [];
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

    expect(common.length).toBe(4); // FC Nordvest, Husum BK, Brønshøj BK, Nørrebro United

    const nordvest = common.find((c) => c.opponent === "FC Nordvest");
    expect(nordvest).toBeDefined();
    expect(nordvest.ourResult).toBe("L"); // 0-1
    expect(nordvest.theirResult).toBe("L"); // 1-2

    const husum = common.find((c) => c.opponent === "Husum BK");
    expect(husum).toBeDefined();
    expect(husum.ourResult).toBe("W"); // 2-1
    expect(husum.theirResult).toBe("W"); // 1-0

    const bronshoj = common.find((c) => c.opponent === "Brønshøj BK");
    expect(bronshoj).toBeDefined();
    expect(bronshoj.ourResult).toBe("W"); // 4-0
    expect(bronshoj.theirResult).toBe("W"); // 3-0

    const norrebro = common.find((c) => c.opponent === "Nørrebro United");
    expect(norrebro).toBeDefined();
    expect(norrebro.ourResult).toBe("D"); // 2-2
    expect(norrebro.theirResult).toBe("D"); // 1-1
  });

  test("head-to-head result classification", () => {
    const classify = (ourGoals: number, theirGoals: number) => {
      if (ourGoals > theirGoals) return "W";
      if (ourGoals < theirGoals) return "L";
      return "D";
    };

    expect(classify(3, 1)).toBe("W");
    expect(classify(0, 1)).toBe("L");
    expect(classify(2, 2)).toBe("D");
    expect(classify(0, 0)).toBe("D");
  });
});
