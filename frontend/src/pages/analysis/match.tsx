import { useState, useEffect } from "react";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Swords, Users, Trophy, XCircle } from "lucide-react";

interface DbuMatch {
  date: string;
  opponent: string;
  result: "win" | "draw" | "loss";
  score: string;
  isHome: boolean;
}

interface PlayerRate {
  id: string;
  displayName: string;
  profilePicture?: string | null;
  trainingMatches: number;
  trainingWins: number;
  trainingLosses: number;
  trainingWinRate: number;
}

interface DbuSummary {
  total: number;
  wins: number;
  draws: number;
  losses: number;
}

interface AnalysisData {
  dbuMatches: DbuMatch[];
  dbuSummary: DbuSummary;
  playerRates: PlayerRate[];
}

const resultBadge = (result: "win" | "draw" | "loss") => {
  const variants = {
    win: "success" as const,
    draw: "info" as const,
    loss: "error" as const,
  };
  const labels = {
    win: da.analysis.win,
    draw: da.analysis.draw,
    loss: da.analysis.loss,
  };
  return <Badge variant={variants[result]}>{labels[result]}</Badge>;
};

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

const winRateColor = (rate: number) => {
  if (rate > 50) return "text-emerald-400";
  if (rate === 50) return "text-zinc-400";
  return "text-red-400";
};

export default function MatchAnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AnalysisData>("/analysis/player-rates")
      .then(setData)
      .catch(() => setError("Kunne ikke indlæse analysedata"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div data-testid="page-analysis">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.analysis.title}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
              <div className="h-8 bg-zinc-800 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-analysis">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.analysis.title}</h1>
        <Card><CardContent className="py-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Prøv igen</Button>
        </CardContent></Card>
      </div>
    );
  }

  if (!data) return null;

  const summaryCards = [
    { label: da.analysis.matches, value: data.dbuSummary.total, icon: Swords, color: "text-zinc-50" },
    { label: da.analysis.win, value: data.dbuSummary.wins, icon: Trophy, color: "text-emerald-400" },
    { label: da.analysis.draw, value: data.dbuSummary.draws, icon: BarChart3, color: "text-blue-400" },
    { label: da.analysis.loss, value: data.dbuSummary.losses, icon: XCircle, color: "text-red-400" },
  ];

  return (
    <div data-testid="page-analysis" className="animate-fade-in-up">
      <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.analysis.title}</h1>

      {/* DBU Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 animate-stagger" data-testid="analysis-summary">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4 text-center">
            <card.icon className={`w-5 h-5 ${card.color} mx-auto mb-2 opacity-60`} />
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{card.label}</p>
            <p className={`text-2xl font-bold tabular-nums mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* DBU Matches */}
      {data.dbuMatches.length === 0 ? (
        <Card className="mb-6"><CardContent className="py-8 text-center">
          <p className="text-zinc-500">Ingen DBU-kampe endnu</p>
        </CardContent></Card>
      ) : (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-50">{da.analysis.dbuMatches}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="analysis-dbu-matches-table">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 text-xs font-medium uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">{da.analysis.date}</th>
                  <th className="px-4 py-3 text-left">{da.analysis.opponent}</th>
                  <th className="px-4 py-3 text-center">{da.analysis.score}</th>
                  <th className="px-4 py-3 text-center">{da.analysis.home}/{da.analysis.away}</th>
                  <th className="px-4 py-3 text-center">{da.analysis.result}</th>
                </tr>
              </thead>
              <tbody>
                {data.dbuMatches.map((m) => (
                  <tr
                    key={`${m.date}-${m.opponent}`}
                    className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm tabular-nums text-zinc-300">{m.date}</td>
                    <td className="px-4 py-3 text-sm text-zinc-200">{m.opponent}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium tabular-nums text-zinc-100">{m.score}</td>
                    <td className="px-4 py-3 text-center text-sm text-zinc-400">{m.isHome ? da.analysis.home : da.analysis.away}</td>
                    <td className="px-4 py-3 text-center">{resultBadge(m.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Player Training Rates */}
      {data.playerRates.length === 0 ? (
        <Card><CardContent className="py-8 text-center">
          <p className="text-zinc-500">Ingen spillerdata endnu</p>
        </CardContent></Card>
      ) : (
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-50">{da.analysis.playerRates}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="analysis-player-rates-table">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 text-xs font-medium uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Navn</th>
                  <th className="px-4 py-3 text-center">{da.analysis.matches}</th>
                  <th className="px-4 py-3 text-center">{da.analysis.trainingWins}</th>
                  <th className="px-4 py-3 text-center">{da.analysis.trainingLosses}</th>
                  <th className="px-4 py-3 text-center">{da.analysis.winRate}</th>
                </tr>
              </thead>
              <tbody>
                {data.playerRates.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-zinc-200">
                      <div className="flex items-center gap-2.5">
                        <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                        {p.displayName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{p.trainingMatches}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{p.trainingWins}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{p.trainingLosses}</td>
                    <td className={`px-4 py-3 text-center text-sm font-bold tabular-nums ${winRateColor(p.trainingWinRate)}`}>
                      {p.trainingWinRate}%
                    </td>
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
