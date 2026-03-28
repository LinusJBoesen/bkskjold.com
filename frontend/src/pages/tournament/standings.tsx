import { useState, useEffect } from "react";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Trophy, Calendar, Clock } from "lucide-react";

interface Standing {
  position: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalDiff: string;
  points: number;
}

interface DbuMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
}

const SKJOLD = "BK Skjold";
const SKJOLD_ALT = "Skjold 10";

function isSkjoldTeam(name: string) {
  return name === SKJOLD || name === SKJOLD_ALT;
}

export default function TournamentStandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [matches, setMatches] = useState<DbuMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [standingsData, matchesData] = await Promise.all([
        api.get<{ standings: Standing[] }>("/tournament/standings"),
        api.get<{ matches: DbuMatch[] }>("/tournament/matches"),
      ]);
      setStandings(standingsData.standings);
      setMatches(matchesData.matches);
    } catch {
      setError("Kunne ikke indlæse turneringsdata");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.post("/sync/dbu");
      await fetchData();
      toast("Turneringsdata opdateret", "success");
    } catch {
      toast("Opdatering fejlede", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const getRowStyle = (position: number, total: number) => {
    if (position <= 2) return "border-l-2 border-l-accent-green";
    if (position >= total - 1) return "border-l-2 border-l-brand-red";
    return "border-l-2 border-l-transparent";
  };

  const isSkjold = (name: string) => name === SKJOLD;

  const today = new Date().toISOString().split("T")[0]!;
  const upcoming = matches.filter((m) => m.homeScore === null && m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const results = matches.filter((m) => m.homeScore !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div data-testid="page-tournament" className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          {da.tournament.title}
        </h1>
        <button
          data-testid="tournament-refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium shadow-lg shadow-red-600/20 transition-all duration-200"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? da.tournament.refreshing : da.tournament.refresh}
        </button>
      </div>

      {loading ? (
        <Card><CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        </CardContent></Card>
      ) : error ? (
        <Card><CardContent className="py-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchData}>Prøv igen</Button>
        </CardContent></Card>
      ) : standings.length === 0 ? (
        <Card><CardContent className="py-8 text-center">
          <p className="text-zinc-500" data-testid="tournament-empty">Ingen turneringsdata endnu</p>
        </CardContent></Card>
      ) : (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="tournament-standings-table">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 text-xs font-medium uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">{da.tournament.position}</th>
                  <th className="px-4 py-3 text-left">{da.tournament.team}</th>
                  <th className="px-4 py-3 text-center">{da.tournament.played}</th>
                  <th className="px-4 py-3 text-center">{da.tournament.wins}</th>
                  <th className="px-4 py-3 text-center">{da.tournament.draws}</th>
                  <th className="px-4 py-3 text-center">{da.tournament.losses}</th>
                  <th className="px-4 py-3 text-center">{da.tournament.goalDiff}</th>
                  <th className="px-4 py-3 text-center">{da.tournament.points}</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr
                    key={s.position}
                    data-testid={`tournament-row-${s.position}`}
                    className={`${getRowStyle(s.position, standings.length)} ${
                      isSkjold(s.teamName) ? "bg-red-500/5" : ""
                    } border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm tabular-nums text-zinc-300">{s.position}</td>
                    <td className="px-4 py-3 text-sm">
                      {isSkjold(s.teamName) ? (
                        <span className="text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">{s.teamName}</span>
                      ) : (
                        <span className="text-zinc-200">{s.teamName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{s.matchesPlayed}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{s.wins}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{s.draws}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{s.losses}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{s.goalDiff}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold tabular-nums text-zinc-50">{s.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            {da.tournament.upcomingMatches}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-zinc-500 text-sm">{da.tournament.noMatches}</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((m, i) => (
                <div key={i} className="grid grid-cols-3 items-center px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                  <span className={`text-sm font-medium ${isSkjoldTeam(m.homeTeam) ? "text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-zinc-200"}`}>{m.homeTeam}</span>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-medium text-zinc-300 flex items-center gap-1"><Clock className="w-3 h-3" />{m.date}</span>
                    <span className="text-xs font-bold text-zinc-400">vs</span>
                  </div>
                  <span className={`text-sm font-medium text-right ${isSkjoldTeam(m.awayTeam) ? "text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-zinc-200"}`}>{m.awayTeam}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previous Results */}
      <Card className="mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-zinc-400" />
            {da.tournament.previousResults}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />)}
            </div>
          ) : results.length === 0 ? (
            <p className="text-zinc-500 text-sm">{da.tournament.noMatches}</p>
          ) : (
            <div className="space-y-2">
              {results.map((m, i) => {
                const skjoldHome = isSkjoldTeam(m.homeTeam);
                const skjoldAway = isSkjoldTeam(m.awayTeam);
                const skjoldWon = (skjoldHome && (m.homeScore ?? 0) > (m.awayScore ?? 0)) ||
                                  (skjoldAway && (m.awayScore ?? 0) > (m.homeScore ?? 0));
                const draw = m.homeScore === m.awayScore;
                return (
                  <div key={i} className={`grid grid-cols-3 items-center px-4 py-3 rounded-lg border ${(skjoldHome || skjoldAway) && !skjoldWon && !draw ? "border-red-500/30 bg-red-500/5" : "border-zinc-800 bg-zinc-900/30"}`}>
                    <span className={`text-sm font-medium ${skjoldHome ? "text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-zinc-200"}`}>{m.homeTeam}</span>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`text-base font-bold tabular-nums ${(skjoldHome || skjoldAway) ? (draw ? "text-zinc-400" : skjoldWon ? "text-emerald-400" : "text-red-400") : "text-zinc-200"}`}>
                        {m.homeScore} - {m.awayScore}
                      </span>
                      <span className="text-sm font-medium text-zinc-300">{m.date}</span>
                    </div>
                    <span className={`text-sm font-medium text-right ${skjoldAway ? "text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-zinc-200"}`}>{m.awayTeam}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
