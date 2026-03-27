import { useState, useEffect } from "react";
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
import { Download, Trophy, Users, Swords, Trash2 } from "lucide-react";

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

interface Match {
  id: string;
  date: string;
  status: string;
  winning_team: number | null;
  score_team1: number | null;
  score_team2: number | null;
  players: MatchPlayer[];
}

interface PlayerStat {
  id: string;
  display_name: string;
  profile_picture?: string | null;
  matches: number;
  wins: number;
  losses: number;
}

export default function TrainingHistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "10" | "20">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
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
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">{da.nav.history}</h1>
        <Button variant="secondary" onClick={exportCsv} data-testid="history-export-csv">
          <Download className="w-4 h-4 mr-2" />
          Eksportér CSV
        </Button>
      </div>

      {/* Player Statistics */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Spillerstatistik
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
                    <TableHead>Navn</TableHead>
                    <TableHead className="text-right">Kampe</TableHead>
                    <TableHead className="text-right">Sejre</TableHead>
                    <TableHead className="text-right">Nederlag</TableHead>
                    <TableHead className="text-right">Sejrsrate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((s) => (
                    <TableRow key={s.id} data-testid={`stat-row-${s.id}`}>
                      <TableCell className="font-medium text-zinc-200">
                        <div className="flex items-center gap-2.5">
                          <PlayerAvatar name={s.display_name} src={s.profile_picture} />
                          {s.display_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-zinc-300">{s.matches}</TableCell>
                      <TableCell className="text-right tabular-nums text-zinc-300">{s.wins}</TableCell>
                      <TableCell className="text-right tabular-nums text-zinc-300">{s.losses}</TableCell>
                      <TableCell className={`text-right tabular-nums font-bold ${winRateColor(s)}`}>
                        {s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 50}%
                      </TableCell>
                    </TableRow>
                  ))}
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
              Kamphistorik
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
              return (
                <div key={m.id} className="border border-zinc-800 rounded-lg p-3 text-sm bg-zinc-900/30 transition-all duration-200 hover:border-zinc-700" data-testid={`completed-match-${m.id}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-zinc-500">{m.date}</span>
                    <div className="flex items-center gap-2">
                      {m.score_team1 != null && m.score_team2 != null && (
                        <span className="text-xs font-bold text-zinc-300 tabular-nums">
                          {m.score_team1} - {m.score_team2}
                        </span>
                      )}
                      <Badge variant={m.winning_team === 1 ? "success" : "info"}>
                        Hold {m.winning_team} vandt
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
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                    <div>
                      <span className={m.winning_team === 1 ? "font-bold text-emerald-400" : "text-zinc-400"}>
                        Hold 1:
                      </span>{" "}
                      {team1.map((p) => p.display_name).join(", ")}
                    </div>
                    <div>
                      <span className={m.winning_team === 2 ? "font-bold text-emerald-400" : "text-zinc-400"}>
                        Hold 2:
                      </span>{" "}
                      {team2.map((p) => p.display_name).join(", ")}
                    </div>
                  </div>
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
