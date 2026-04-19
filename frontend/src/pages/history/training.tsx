import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/components/toast";
import { useAuth } from "@/hooks/use-auth";
import { Download, Trophy, Swords, Trash2, ChevronUp, ChevronDown, BarChart3, Flame } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function PlayerAvatar({ name, src }: { name: string; src?: string | null }) {
  if (src) {
    return (
      <img src={src} alt={name} className="h-7 w-7 rounded-full object-cover border border-zinc-700" />
    );
  }
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-400">
      {initials}
    </div>
  );
}

interface MatchPlayer {
  player_id: string;
  team: number;
  display_name: string;
}

interface MatchEvent {
  event_type: string;
  minute: number | null;
  display_name: string;
}

interface Match {
  id: string;
  date: string;
  status: string;
  winning_team: number | null;
  score_team1: number | null;
  score_team2: number | null;
  players: MatchPlayer[];
  events?: MatchEvent[];
}

interface PlayerStat {
  id: string;
  display_name: string;
  profile_picture?: string | null;
  matches: number;
  wins: number;
  losses: number;
}

type SortKey = "name" | "matches" | "wins" | "losses" | "winRate";
type SortDir = "asc" | "desc";

function FormDot({ result }: { result: "W" | "L" | "D" }) {
  const colors = {
    W: "bg-emerald-500",
    L: "bg-red-500",
    D: "bg-zinc-500",
  };
  const labels = { W: "S", L: "T", D: "U" };
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${colors[result]}`}
      title={result === "W" ? "Sejr" : result === "L" ? "Tab" : "Uafgjort"}
    >
      {labels[result]}
    </span>
  );
}

function StreakBadge({ streak }: { streak: string }) {
  if (!streak) return null;
  const count = parseInt(streak);
  const type = streak.slice(-1);
  if (count < 2) return null;
  const isWin = type === "W";
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isWin ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
      <Flame className="w-3 h-3" />
      {count}{isWin ? "S" : "T"}
    </span>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronDown className="w-3 h-3 text-zinc-600 inline ml-0.5" />;
  return dir === "asc"
    ? <ChevronUp className="w-3 h-3 text-red-400 inline ml-0.5" />
    : <ChevronDown className="w-3 h-3 text-red-400 inline ml-0.5" />;
}

const WinRateBarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-zinc-200">{d.name}</p>
      <p className="text-zinc-400">{da.history.winRate}: <span className="text-zinc-100 font-bold tabular-nums">{d.winRate}%</span></p>
      <p className="text-zinc-400 tabular-nums">{d.wins}S / {d.losses}T af {d.matches} {da.history.matchesPlayed}</p>
    </div>
  );
};

export default function TrainingHistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "10" | "20">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [statSort, setStatSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "winRate", dir: "desc" });
  const { toast } = useToast();
  const { role } = useAuth();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get<Match[]>("/matches"),
      api.get<PlayerStat[]>("/matches/stats/all"),
    ])
      .then(([matchData, statsData]) => {
        setMatches(matchData);
        setStats(statsData);
      })
      .catch(() => setError("Kunne ikke indlæse træningsdata"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const completedMatches = matches.filter((m) => m.status === "completed");

  // Compute per-player form from completed matches (last 5 results)
  const playerFormMap = useMemo(() => {
    const sorted = [...completedMatches].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const formMap: Record<string, string[]> = {};
    for (const m of sorted) {
      for (const p of m.players) {
        if (!formMap[p.player_id]) formMap[p.player_id] = [];
        if (formMap[p.player_id].length < 5) {
          const result =
            m.winning_team === null ? "D" : m.winning_team === p.team ? "W" : "L";
          formMap[p.player_id].push(result);
        }
      }
    }
    return formMap;
  }, [completedMatches]);

  // Compute streak from form results
  const getStreak = (results: string[]): string => {
    if (results.length === 0) return "";
    const first = results[0];
    let count = 0;
    for (const r of results) {
      if (r === first) count++;
      else break;
    }
    return `${count}${first}`;
  };

  // Sorted stats for the table
  const sortedStats = useMemo(() => {
    const getWinRate = (s: PlayerStat) => s.matches > 0 ? (s.wins / s.matches) * 100 : 50;
    return [...stats].sort((a, b) => {
      let cmp = 0;
      switch (statSort.key) {
        case "name":
          cmp = a.display_name.localeCompare(b.display_name);
          break;
        case "matches":
          cmp = a.matches - b.matches;
          break;
        case "wins":
          cmp = a.wins - b.wins;
          break;
        case "losses":
          cmp = a.losses - b.losses;
          break;
        case "winRate":
          cmp = getWinRate(a) - getWinRate(b);
          break;
      }
      return statSort.dir === "asc" ? cmp : -cmp;
    });
  }, [stats, statSort]);

  // Win rate chart data (top 15, sorted desc)
  const winRateChartData = useMemo(() => {
    return [...stats]
      .filter((s) => s.matches > 0)
      .map((s) => ({
        name: s.display_name.split(" ")[0],
        fullName: s.display_name,
        winRate: Math.round((s.wins / s.matches) * 100),
        wins: Number(s.wins),
        losses: Number(s.losses),
        matches: Number(s.matches),
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 15);
  }, [stats]);

  // Best and worst win rate IDs for highlighting
  const { bestId, worstId } = useMemo(() => {
    const withRate = stats
      .filter((s) => s.matches >= 2)
      .map((s) => ({ id: s.id, rate: s.wins / s.matches }));
    if (withRate.length === 0) return { bestId: null, worstId: null };
    withRate.sort((a, b) => b.rate - a.rate);
    return { bestId: withRate[0].id, worstId: withRate[withRate.length - 1].id };
  }, [stats]);

  const sortedCompleted = [...completedMatches].sort((a, b) =>
    sort === "newest"
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filteredCompleted = filter === "all"
    ? sortedCompleted
    : sortedCompleted.slice(0, parseInt(filter));

  const exportCsv = () => {
    window.open("/api/matches/export/csv", "_blank");
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm("Er du sikker på, at du vil slette denne kamp?")) return;
    try {
      await api.delete(`/matches/${matchId}`);
      toast("Kamp slettet", "success");
      loadData();
    } catch {
      toast("Kunne ikke slette kamp", "error");
    }
  };

  const winRateColor = (stat: PlayerStat) => {
    if (stat.matches === 0) return "text-zinc-400";
    const rate = stat.wins / stat.matches;
    if (rate > 0.5) return "text-emerald-400";
    if (rate < 0.5) return "text-red-400";
    return "text-zinc-400";
  };

  const toggleSort = (key: SortKey) => {
    setStatSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" }
    );
  };

  const barColor = (winRate: number) => {
    if (winRate >= 60) return "#10b981"; // emerald-500
    if (winRate >= 40) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("da-DK", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) {
    return (
      <div data-testid="page-history">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.nav.history}</h1>
        <Card><CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        </CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-history">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.nav.history}</h1>
        <Card><CardContent className="py-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => { setError(null); loadData(); }}>Prøv igen</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div data-testid="page-history" className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight">{da.nav.history}</h1>
        <Button variant="secondary" onClick={exportCsv} data-testid="history-export-csv">
          <Download className="w-4 h-4 mr-2" />
          Eksportér CSV
        </Button>
      </div>

      {/* Win Rate Bar Chart */}
      {winRateChartData.length > 0 && (
        <Card className="mb-6" data-testid="history-winrate-chart">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-400" />
              {da.history.winRateChart}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] sm:h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={winRateChartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" width={70} tick={{ fill: "#d4d4d8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<WinRateBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="winRate" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {winRateChartData.map((entry, i) => (
                      <Cell key={i} fill={barColor(entry.winRate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Statistics — Sortable Table with Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            {da.history.playerStats}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stats.length === 0 ? (
            <p className="text-zinc-500 text-sm p-6" data-testid="history-stats-empty">Ingen spillerstatistik endnu</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none hover:text-zinc-200 transition-colors"
                      onClick={() => toggleSort("name")}
                    >
                      {da.history.name}
                      <SortIcon active={statSort.key === "name"} dir={statSort.dir} />
                    </TableHead>
                    <TableHead className="text-center cursor-pointer select-none hover:text-zinc-200 transition-colors" onClick={() => toggleSort("matches")}>
                      {da.history.matchesCol}
                      <SortIcon active={statSort.key === "matches"} dir={statSort.dir} />
                    </TableHead>
                    <TableHead className="text-center cursor-pointer select-none hover:text-zinc-200 transition-colors" onClick={() => toggleSort("wins")}>
                      {da.history.winsCol}
                      <SortIcon active={statSort.key === "wins"} dir={statSort.dir} />
                    </TableHead>
                    <TableHead className="text-center cursor-pointer select-none hover:text-zinc-200 transition-colors" onClick={() => toggleSort("losses")}>
                      {da.history.lossesCol}
                      <SortIcon active={statSort.key === "losses"} dir={statSort.dir} />
                    </TableHead>
                    <TableHead className="text-center cursor-pointer select-none hover:text-zinc-200 transition-colors" onClick={() => toggleSort("winRate")}>
                      {da.history.winRate}
                      <SortIcon active={statSort.key === "winRate"} dir={statSort.dir} />
                    </TableHead>
                    <TableHead className="text-center hidden sm:table-cell">{da.history.form}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStats.map((s) => {
                    const form = playerFormMap[s.id] || [];
                    const streak = getStreak(form);
                    const isBest = s.id === bestId;
                    const isWorst = s.id === worstId;
                    return (
                      <TableRow
                        key={s.id}
                        data-testid={`stat-row-${s.id}`}
                        className={
                          isBest
                            ? "bg-emerald-500/5 border-l-2 border-l-emerald-500"
                            : isWorst
                            ? "bg-red-500/5 border-l-2 border-l-red-500"
                            : ""
                        }
                      >
                        <TableCell className="font-medium text-zinc-200">
                          <div className="flex items-center gap-2.5">
                            <PlayerAvatar name={s.display_name} src={s.profile_picture} />
                            <span>{s.display_name}</span>
                            {isBest && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold hidden sm:inline">MVP</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-zinc-300">{s.matches}</TableCell>
                        <TableCell className="text-center tabular-nums text-zinc-300">{s.wins}</TableCell>
                        <TableCell className="text-center tabular-nums text-zinc-300">{s.losses}</TableCell>
                        <TableCell className={`text-center tabular-nums font-bold ${winRateColor(s)}`}>
                          {s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 50}%
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            {form.map((r, i) => (
                              <FormDot key={i} result={r as "W" | "L" | "D"} />
                            ))}
                            <StreakBadge streak={streak} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Swords className="w-5 h-5 text-zinc-400" />
              {da.history.matchHistory}
            </CardTitle>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
                data-testid="history-filter"
              >
                <option value="all">Alle</option>
                <option value="10">Seneste 10</option>
                <option value="20">Seneste 20</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
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
              const isDraw = m.winning_team === null;
              const events = m.events || [];
              const goals = events.filter((e) => e.event_type === "goal");
              const assists = events.filter((e) => e.event_type === "assist");
              const cards = events.filter((e) => e.event_type === "yellow_card" || e.event_type === "red_card");
              const hasEvents = events.length > 0;
              return (
                <div key={m.id} className="border border-zinc-800 rounded-lg p-4 text-sm bg-zinc-900/30 transition-all duration-200 hover:border-zinc-700" data-testid={`completed-match-${m.id}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-zinc-500 text-xs">{formatDate(m.date)}</span>
                    <div className="flex items-center gap-2">
                      {m.score_team1 != null && m.score_team2 != null && (
                        <span className="text-sm font-bold text-zinc-100 tabular-nums bg-zinc-800 px-2 py-0.5 rounded">
                          {m.score_team1} - {m.score_team2}
                        </span>
                      )}
                      <Badge variant={isDraw ? "secondary" : m.winning_team === 1 ? "success" : "info"}>
                        {isDraw ? "Uafgjort" : `Hold ${m.winning_team} vandt`}
                      </Badge>
                      {role === "admin" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMatch(m.id); }}
                          className="text-zinc-600 hover:text-red-400 transition-colors"
                          data-testid={`delete-completed-match-${m.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className={`rounded-md px-3 py-2 ${m.winning_team === 1 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-zinc-800/50 border border-zinc-800"}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-xs font-bold ${m.winning_team === 1 ? "text-emerald-400" : "text-zinc-400"}`}>
                          Hold 1 {m.winning_team === 1 ? "🏆" : ""}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 leading-relaxed">
                        {team1.map((p) => p.display_name).join(", ")}
                      </div>
                    </div>
                    <div className={`rounded-md px-3 py-2 ${m.winning_team === 2 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-zinc-800/50 border border-zinc-800"}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-xs font-bold ${m.winning_team === 2 ? "text-emerald-400" : "text-zinc-400"}`}>
                          Hold 2 {m.winning_team === 2 ? "🏆" : ""}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 leading-relaxed">
                        {team2.map((p) => p.display_name).join(", ")}
                      </div>
                    </div>
                  </div>
                  {hasEvents && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/50 flex flex-wrap gap-x-4 gap-y-1">
                      {goals.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <span className="text-emerald-400">{da.history.goalsLabel}:</span>
                          <span>{goals.map((g) => g.display_name + (g.minute ? ` (${g.minute}')` : "")).join(", ")}</span>
                        </div>
                      )}
                      {assists.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <span className="text-blue-400">{da.history.assistsLabel}:</span>
                          <span>{assists.map((a) => a.display_name + (a.minute ? ` (${a.minute}')` : "")).join(", ")}</span>
                        </div>
                      )}
                      {cards.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <span className="text-yellow-400">{da.history.cardsLabel}:</span>
                          <span>{cards.map((c) => c.display_name + (c.event_type === "red_card" ? " (R)" : "")).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filteredCompleted.length === 0 && (
              <p className="text-zinc-500 text-sm" data-testid="history-empty">Ingen afsluttede kampe endnu</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
