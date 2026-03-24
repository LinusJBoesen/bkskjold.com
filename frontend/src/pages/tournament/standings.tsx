import { useState, useEffect } from "react";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Trophy } from "lucide-react";

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

export default function TournamentStandingsPage() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ standings: Standing[] }>("/tournament/standings");
      setStandings(data.standings);
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

  const isSkjold = (name: string) => name === "BK Skjold";

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
                        <span className="text-red-400 font-bold">{s.teamName}</span>
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
    </div>
  );
}
