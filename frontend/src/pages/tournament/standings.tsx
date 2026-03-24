import { useState, useEffect } from "react";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  const getRowColor = (position: number, total: number) => {
    if (position <= 2) return "bg-green-50 border-l-4 border-l-accent-green";
    if (position >= total - 1) return "bg-red-50 border-l-4 border-l-brand-red";
    return "border-l-4 border-l-transparent";
  };

  const isSkjold = (name: string) => name === "BK Skjold";

  return (
    <div data-testid="page-tournament">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-brand-black">{da.tournament.title}</h1>
        <button
          data-testid="tournament-refresh-button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-brand-red-dark disabled:opacity-50 text-sm font-medium"
        >
          {refreshing ? da.tournament.refreshing : da.tournament.refresh}
        </button>
      </div>

      {loading ? (
        <Card><CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-neutral-light-gray rounded animate-pulse" />
            ))}
          </div>
        </CardContent></Card>
      ) : error ? (
        <Card><CardContent className="py-8 text-center">
          <p className="text-brand-red mb-4">{error}</p>
          <Button onClick={fetchData}>Prøv igen</Button>
        </CardContent></Card>
      ) : standings.length === 0 ? (
        <Card><CardContent className="py-8 text-center">
          <p className="text-neutral-mid-gray" data-testid="tournament-empty">Ingen turneringsdata endnu</p>
        </CardContent></Card>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-light-gray overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="tournament-standings-table">
              <thead>
                <tr className="bg-brand-black text-white text-sm">
                  <th className="px-4 py-3 text-left font-semibold">{da.tournament.position}</th>
                  <th className="px-4 py-3 text-left font-semibold">{da.tournament.team}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.tournament.played}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.tournament.wins}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.tournament.draws}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.tournament.losses}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.tournament.goalDiff}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.tournament.points}</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr
                    key={s.position}
                    data-testid={`tournament-row-${s.position}`}
                    className={`${getRowColor(s.position, standings.length)} ${
                      i % 2 === 0 ? "bg-white" : "bg-brand-off-white"
                    } ${isSkjold(s.teamName) ? "font-bold" : ""} hover:bg-neutral-light-gray transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm tabular-nums">{s.position}</td>
                    <td className="px-4 py-3 text-sm">
                      {isSkjold(s.teamName) ? (
                        <span className="text-brand-red">{s.teamName}</span>
                      ) : (
                        s.teamName
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums">{s.matchesPlayed}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums">{s.wins}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums">{s.draws}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums">{s.losses}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums">{s.goalDiff}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold tabular-nums">{s.points}</td>
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
