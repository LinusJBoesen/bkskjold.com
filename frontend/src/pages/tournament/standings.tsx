import { useState, useEffect } from "react";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function TournamentStandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [upcoming, setUpcoming] = useState<DbuMatch[]>([]);
  const [previous, setPrevious] = useState<DbuMatch[]>([]);
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
        api.get<{ upcoming: DbuMatch[]; previous: DbuMatch[] }>("/tournament/matches"),
      ]);
      setStandings(standingsData.standings);
      setUpcoming(matchesData.upcoming);
      setPrevious(matchesData.previous);
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
      {!loading && !error && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              {da.tournament.upcoming}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-zinc-500 text-sm" data-testid="tournament-no-upcoming">{da.tournament.noUpcoming}</p>
            ) : (
              <div className="space-y-3" data-testid="tournament-upcoming-matches">
                {upcoming.map((m, i) => {
                  const isSkjoldHome = m.homeTeam === "BK Skjold";
                  const isSkjoldAway = m.awayTeam === "BK Skjold";
                  return (
                    <div key={`${m.date}-${m.homeTeam}-${i}`} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500 tabular-nums w-20">{m.date}</span>
                        <span className={isSkjoldHome ? "text-red-400 font-semibold text-sm" : "text-zinc-200 text-sm"}>
                          {m.homeTeam}
                        </span>
                        <span className="text-zinc-600 text-xs">{da.tournament.vs}</span>
                        <span className={isSkjoldAway ? "text-red-400 font-semibold text-sm" : "text-zinc-200 text-sm"}>
                          {m.awayTeam}
                        </span>
                      </div>
                      <Badge variant="default">
                        {isSkjoldHome ? da.tournament.home : da.tournament.away}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Previous Matches */}
      {!loading && !error && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-zinc-400" />
              {da.tournament.previous}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previous.length === 0 ? (
              <p className="text-zinc-500 text-sm" data-testid="tournament-no-previous">{da.tournament.noPrevious}</p>
            ) : (
              <div className="space-y-3" data-testid="tournament-previous-matches">
                {previous.map((m, i) => {
                  const isSkjoldHome = m.homeTeam === "BK Skjold";
                  const isSkjoldAway = m.awayTeam === "BK Skjold";
                  const skjoldWon = (isSkjoldHome && (m.homeScore ?? 0) > (m.awayScore ?? 0)) ||
                                    (isSkjoldAway && (m.awayScore ?? 0) > (m.homeScore ?? 0));
                  const skjoldLost = (isSkjoldHome && (m.homeScore ?? 0) < (m.awayScore ?? 0)) ||
                                     (isSkjoldAway && (m.awayScore ?? 0) < (m.homeScore ?? 0));
                  return (
                    <div key={`${m.date}-${m.homeTeam}-${i}`} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500 tabular-nums w-20">{m.date}</span>
                        <span className={isSkjoldHome ? "text-red-400 font-semibold text-sm" : "text-zinc-200 text-sm"}>
                          {m.homeTeam}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-zinc-100">
                          {m.homeScore} - {m.awayScore}
                        </span>
                        <span className={isSkjoldAway ? "text-red-400 font-semibold text-sm" : "text-zinc-200 text-sm"}>
                          {m.awayTeam}
                        </span>
                      </div>
                      <Badge variant={skjoldWon ? "success" : skjoldLost ? "error" : "info"}>
                        {skjoldWon ? "Sejr" : skjoldLost ? "Nederlag" : "Uafgjort"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
