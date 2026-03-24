import { useState, useEffect } from "react";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  const styles = {
    win: "bg-green-100 text-accent-green",
    draw: "bg-blue-100 text-accent-steel-blue",
    loss: "bg-red-100 text-brand-red",
  };
  const labels = {
    win: da.analysis.win,
    draw: da.analysis.draw,
    loss: da.analysis.loss,
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[result]}`}>
      {labels[result]}
    </span>
  );
};

const winRateColor = (rate: number) => {
  if (rate > 50) return "text-accent-green";
  if (rate === 50) return "text-accent-steel-blue";
  return "text-brand-red";
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
        <h1 className="text-2xl font-bold text-brand-black mb-6">{da.analysis.title}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-neutral-light-gray p-4">
              <div className="h-8 bg-neutral-light-gray rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-analysis">
        <h1 className="text-2xl font-bold text-brand-black mb-6">{da.analysis.title}</h1>
        <Card><CardContent className="py-8 text-center">
          <p className="text-brand-red mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Prøv igen</Button>
        </CardContent></Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div data-testid="page-analysis">
      <h1 className="text-2xl font-bold text-brand-black mb-6">{da.analysis.title}</h1>

      {/* DBU Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" data-testid="analysis-summary">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-light-gray p-4 text-center">
          <p className="text-xs font-medium text-neutral-mid-gray">{da.analysis.matches}</p>
          <p className="text-2xl font-bold tabular-nums text-brand-black">{data.dbuSummary.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-neutral-light-gray p-4 text-center">
          <p className="text-xs font-medium text-neutral-mid-gray">{da.analysis.win}</p>
          <p className="text-2xl font-bold tabular-nums text-accent-green">{data.dbuSummary.wins}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-neutral-light-gray p-4 text-center">
          <p className="text-xs font-medium text-neutral-mid-gray">{da.analysis.draw}</p>
          <p className="text-2xl font-bold tabular-nums text-accent-steel-blue">{data.dbuSummary.draws}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-neutral-light-gray p-4 text-center">
          <p className="text-xs font-medium text-neutral-mid-gray">{da.analysis.loss}</p>
          <p className="text-2xl font-bold tabular-nums text-brand-red">{data.dbuSummary.losses}</p>
        </div>
      </div>

      {/* DBU Matches */}
      {data.dbuMatches.length === 0 ? (
        <Card className="mb-6"><CardContent className="py-8 text-center">
          <p className="text-neutral-mid-gray">Ingen DBU-kampe endnu</p>
        </CardContent></Card>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-light-gray overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-neutral-light-gray">
            <h2 className="text-lg font-semibold text-brand-black">{da.analysis.dbuMatches}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="analysis-dbu-matches-table">
              <thead>
                <tr className="bg-brand-black text-white text-sm">
                  <th className="px-4 py-3 text-left font-semibold">{da.analysis.date}</th>
                  <th className="px-4 py-3 text-left font-semibold">{da.analysis.opponent}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.analysis.score}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.analysis.home}/{da.analysis.away}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.analysis.result}</th>
                </tr>
              </thead>
              <tbody>
                {data.dbuMatches.map((m, i) => (
                  <tr
                    key={`${m.date}-${m.opponent}`}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-brand-off-white"} hover:bg-neutral-light-gray transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm tabular-nums">{m.date}</td>
                    <td className="px-4 py-3 text-sm">{m.opponent}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium tabular-nums">{m.score}</td>
                    <td className="px-4 py-3 text-center text-sm">{m.isHome ? da.analysis.home : da.analysis.away}</td>
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
          <p className="text-neutral-mid-gray">Ingen spillerdata endnu</p>
        </CardContent></Card>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-light-gray overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-light-gray">
            <h2 className="text-lg font-semibold text-brand-black">{da.analysis.playerRates}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="analysis-player-rates-table">
              <thead>
                <tr className="bg-brand-black text-white text-sm">
                  <th className="px-4 py-3 text-left font-semibold">Navn</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.analysis.matches}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.analysis.trainingWins}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.analysis.trainingLosses}</th>
                  <th className="px-4 py-3 text-center font-semibold">{da.analysis.winRate}</th>
                </tr>
              </thead>
              <tbody>
                {data.playerRates.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`${i % 2 === 0 ? "bg-white" : "bg-brand-off-white"} hover:bg-neutral-light-gray transition-colors`}
                  >
                    <td className="px-4 py-3 text-sm font-medium">{p.displayName}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums">{p.trainingMatches}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums">{p.trainingWins}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums">{p.trainingLosses}</td>
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
