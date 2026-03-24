import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";

interface MatchPlayer {
  player_id: string;
  team: number;
  display_name: string;
}

interface Match {
  id: string;
  date: string;
  status: string;
  winning_team: number | null;
  players: MatchPlayer[];
}

interface PlayerStat {
  id: string;
  display_name: string;
  matches: number;
  wins: number;
  losses: number;
}

export default function TrainingHistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [filter, setFilter] = useState<"all" | "10" | "20">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const loadData = () => {
    api.get<Match[]>("/matches").then(setMatches).catch(() => {});
    api.get<PlayerStat[]>("/matches/stats/all").then(setStats).catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingMatches = matches.filter((m) => m.status === "pending");
  const completedMatches = matches.filter((m) => m.status === "completed");

  const sortedCompleted = [...completedMatches].sort((a, b) =>
    sort === "newest"
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filteredCompleted = filter === "all"
    ? sortedCompleted
    : sortedCompleted.slice(0, parseInt(filter));

  const registerResult = async (matchId: string, winningTeam: number) => {
    await api.patch(`/matches/${matchId}/result`, { winning_team: winningTeam });
    loadData();
  };

  const exportCsv = () => {
    window.open("/api/matches/export/csv", "_blank");
  };

  const winRateColor = (stat: PlayerStat) => {
    if (stat.matches === 0) return "text-accent-steel-blue";
    const rate = stat.wins / stat.matches;
    if (rate > 0.5) return "text-accent-green";
    if (rate < 0.5) return "text-brand-red";
    return "text-accent-steel-blue";
  };

  return (
    <div data-testid="page-history">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-black">{da.nav.history}</h1>
        <Button variant="secondary" onClick={exportCsv} data-testid="history-export-csv">
          Eksportér CSV
        </Button>
      </div>

      {/* Pending Matches */}
      {pendingMatches.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Afventende kampe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="history-pending-matches">
              {pendingMatches.map((m) => {
                const team1 = m.players.filter((p) => p.team === 1);
                const team2 = m.players.filter((p) => p.team === 2);
                return (
                  <div key={m.id} className="border rounded-lg p-4" data-testid={`pending-match-${m.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-neutral-mid-gray">{m.date}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => registerResult(m.id, 1)}
                          data-testid={`result-team1-${m.id}`}
                        >
                          Hold 1 Vandt
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => registerResult(m.id, 2)}
                          data-testid={`result-team2-${m.id}`}
                        >
                          Hold 2 Vandt
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Hold 1</p>
                        {team1.map((p) => (
                          <p key={p.player_id} className="text-neutral-mid-gray">{p.display_name}</p>
                        ))}
                      </div>
                      <div>
                        <p className="font-medium mb-1">Hold 2</p>
                        {team2.map((p) => (
                          <p key={p.player_id} className="text-neutral-mid-gray">{p.display_name}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Spillerstatistik</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-brand-black hover:bg-brand-black">
                <TableHead className="text-white">Navn</TableHead>
                <TableHead className="text-white text-right">Kampe</TableHead>
                <TableHead className="text-white text-right">Sejre</TableHead>
                <TableHead className="text-white text-right">Nederlag</TableHead>
                <TableHead className="text-white text-right">Sejrsrate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map((s) => (
                <TableRow key={s.id} data-testid={`stat-row-${s.id}`}>
                  <TableCell className="font-medium">{s.display_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.matches}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.wins}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.losses}</TableCell>
                  <TableCell className={`text-right tabular-nums font-bold ${winRateColor(s)}`}>
                    {s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 50}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Match History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Kamphistorik</CardTitle>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="text-xs border rounded px-2 py-1"
                data-testid="history-filter"
              >
                <option value="all">Alle</option>
                <option value="10">Seneste 10</option>
                <option value="20">Seneste 20</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="text-xs border rounded px-2 py-1"
                data-testid="history-sort"
              >
                <option value="newest">Nyeste</option>
                <option value="oldest">Ældste</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" data-testid="history-match-list">
            {filteredCompleted.map((m) => {
              const team1 = m.players.filter((p) => p.team === 1);
              const team2 = m.players.filter((p) => p.team === 2);
              return (
                <div key={m.id} className="border rounded-lg p-3 text-sm" data-testid={`completed-match-${m.id}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-mid-gray">{m.date}</span>
                    <span className="font-medium">
                      Hold {m.winning_team} vandt
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-neutral-mid-gray">
                    <div>
                      <span className={m.winning_team === 1 ? "font-bold text-accent-green" : ""}>
                        Hold 1:
                      </span>{" "}
                      {team1.map((p) => p.display_name).join(", ")}
                    </div>
                    <div>
                      <span className={m.winning_team === 2 ? "font-bold text-accent-green" : ""}>
                        Hold 2:
                      </span>{" "}
                      {team2.map((p) => p.display_name).join(", ")}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredCompleted.length === 0 && (
              <p className="text-neutral-mid-gray text-sm">Ingen afsluttede kampe endnu</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
