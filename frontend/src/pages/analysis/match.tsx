import { useState, useEffect, useMemo } from "react";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/toast";
import { useAuth } from "@/hooks/use-auth";
import { BarChart3, Swords, Users, Trophy, XCircle, Clock, Plus, X, ClipboardList, Trash2, Target, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
} from "recharts";

interface DbuMatch {
  date: string;
  opponent: string;
  result: "win" | "draw" | "loss";
  score: string;
  isHome: boolean;
}

interface PlayerStat {
  id: string;
  displayName: string;
  profilePicture?: string | null;
  goals: number;
  assists: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
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
  playerStats: PlayerStat[];
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

interface MatchEvent {
  player_id: string;
  event_type: "goal" | "assist" | "yellow_card" | "red_card" | "clean_sheet";
  minute?: number;
}

function PostMatchCard({
  match,
  onComplete,
  onCancel,
}: {
  match: Match;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [scoreTeam1, setScoreTeam1] = useState(0);
  const [scoreTeam2, setScoreTeam2] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const allPlayers = match.players;
  const team1 = allPlayers.filter((p) => p.team === 1);
  const team2 = allPlayers.filter((p) => p.team === 2);

  const addEvent = () => {
    setEvents([...events, { player_id: "", event_type: "goal" }]);
  };

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index));
  };

  const updateEvent = (index: number, field: keyof MatchEvent, value: string | number | undefined) => {
    const updated = [...events];
    (updated[index] as any)[field] = value;
    setEvents(updated);
  };

  const handleSubmit = async () => {
    const winningTeam = scoreTeam1 > scoreTeam2 ? 1 : scoreTeam1 < scoreTeam2 ? 2 : 1;
    const validEvents = events.filter((e) => e.player_id);

    setSubmitting(true);
    try {
      await api.patch(`/matches/${match.id}/complete`, {
        score_team1: scoreTeam1,
        score_team2: scoreTeam2,
        winning_team: winningTeam,
        events: validEvents,
      });
      toast(da.postMatch.completed, "success");
      onComplete();
    } catch {
      toast(da.postMatch.error, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/80 space-y-4" data-testid={`post-match-card-${match.id}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-red-400" />
          {da.postMatch.title} — {match.date}
        </h3>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300" data-testid="post-match-cancel">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Score */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-zinc-400 block mb-1">{da.postMatch.team1}</label>
          <Input
            type="number"
            min={0}
            value={scoreTeam1}
            onChange={(e) => setScoreTeam1(parseInt(e.target.value) || 0)}
            data-testid="post-match-score-team1"
          />
          <div className="text-xs text-zinc-500 mt-1">
            {team1.map((p) => p.display_name).join(", ")}
          </div>
        </div>
        <div>
          <label className="text-xs text-zinc-400 block mb-1">{da.postMatch.team2}</label>
          <Input
            type="number"
            min={0}
            value={scoreTeam2}
            onChange={(e) => setScoreTeam2(parseInt(e.target.value) || 0)}
            data-testid="post-match-score-team2"
          />
          <div className="text-xs text-zinc-500 mt-1">
            {team2.map((p) => p.display_name).join(", ")}
          </div>
        </div>
      </div>

      {/* Events */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-400 font-medium">{da.postMatch.events}</label>
          <Button size="sm" variant="secondary" onClick={addEvent} data-testid="post-match-add-event">
            <Plus className="w-3 h-3 mr-1" />
            {da.postMatch.addEvent}
          </Button>
        </div>
        {events.length === 0 && (
          <p className="text-xs text-zinc-600">{da.postMatch.noEvents}</p>
        )}
        <div className="space-y-2">
          {events.map((event, i) => (
            <div key={i} className="flex gap-2 items-center" data-testid={`post-match-event-${i}`}>
              <select
                value={event.player_id}
                onChange={(e) => updateEvent(i, "player_id", e.target.value)}
                className="flex-1 text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2 py-1.5"
                data-testid={`post-match-event-player-${i}`}
              >
                <option value="">{da.postMatch.selectPlayer}</option>
                {allPlayers.map((p) => (
                  <option key={p.player_id} value={p.player_id}>{p.display_name}</option>
                ))}
              </select>
              <select
                value={event.event_type}
                onChange={(e) => updateEvent(i, "event_type", e.target.value)}
                className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-2 py-1.5"
                data-testid={`post-match-event-type-${i}`}
              >
                <option value="goal">{da.postMatch.goal}</option>
                <option value="assist">{da.postMatch.assist}</option>
                <option value="yellow_card">{da.postMatch.yellowCard}</option>
                <option value="red_card">{da.postMatch.redCard}</option>
                <option value="clean_sheet">{da.postMatch.cleanSheet}</option>
              </select>
              <Input
                type="number"
                min={0}
                max={120}
                placeholder={da.postMatch.minute}
                value={event.minute ?? ""}
                onChange={(e) => updateEvent(i, "minute", e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-16 text-xs"
                data-testid={`post-match-event-minute-${i}`}
              />
              <button onClick={() => removeEvent(i)} className="text-zinc-500 hover:text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full"
        data-testid="post-match-submit"
      >
        {submitting ? da.common.loading : da.postMatch.complete}
      </Button>
    </div>
  );
}

/* ── Custom Tooltip for Bar Chart ── */
function GoalAssistTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-zinc-100 mb-1">{d.name}</p>
      <p className="text-emerald-400 tabular-nums">{da.analysis.goals}: {d.goals}</p>
      <p className="text-blue-400 tabular-nums">{da.analysis.assists}: {d.assists}</p>
    </div>
  );
}

/* ── Form Dot for timeline ── */
function FormDot({ result }: { result: "win" | "draw" | "loss" }) {
  const colors = {
    win: "bg-emerald-500",
    draw: "bg-zinc-500",
    loss: "bg-red-500",
  };
  const labels = { win: "S", draw: "U", loss: "T" };
  return (
    <span
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-white ${colors[result]}`}
    >
      {labels[result]}
    </span>
  );
}

export default function MatchAnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePostMatch, setActivePostMatch] = useState<string | null>(null);
  const { toast } = useToast();
  const { role } = useAuth();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get<AnalysisData>("/analysis/player-rates"),
      api.get<Match[]>("/matches"),
    ])
      .then(([analysisData, matchData]) => {
        setData(analysisData);
        setMatches(matchData);
      })
      .catch(() => setError("Kunne ikke indlæse analysedata"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingMatches = matches.filter((m) => m.status === "pending");

  // Computed chart data
  const goalAssistChart = useMemo(() => {
    if (!data) return [];
    return [...data.playerStats]
      .filter((p) => p.goals > 0 || p.assists > 0)
      .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
      .slice(0, 12)
      .map((p) => ({
        name: p.displayName.split(" ")[0],
        fullName: p.displayName,
        goals: p.goals,
        assists: p.assists,
      }));
  }, [data]);

  const seasonOverview = useMemo(() => {
    if (!data) return null;
    // Parse goals from DBU match scores
    let goalsScored = 0;
    let goalsConceded = 0;
    let cleanSheets = 0;
    for (const m of data.dbuMatches) {
      const [home, away] = m.score.split("-").map((s) => parseInt(s));
      if (isNaN(home) || isNaN(away)) continue;
      if (m.isHome) {
        goalsScored += home;
        goalsConceded += away;
        if (away === 0) cleanSheets++;
      } else {
        goalsScored += away;
        goalsConceded += home;
        if (home === 0) cleanSheets++;
      }
    }
    const winPct = data.dbuSummary.total > 0
      ? Math.round((data.dbuSummary.wins / data.dbuSummary.total) * 100)
      : 0;
    return { goalsScored, goalsConceded, cleanSheets, winPct };
  }, [data]);

  // Cumulative goal difference trend across DBU matches
  const goalDiffTrend = useMemo(() => {
    if (!data || data.dbuMatches.length === 0) return [];
    let cumDiff = 0;
    return [...data.dbuMatches].reverse().map((m) => {
      const [home, away] = m.score.split("-").map((s) => parseInt(s));
      if (isNaN(home) || isNaN(away)) return null;
      const scored = m.isHome ? home : away;
      const conceded = m.isHome ? away : home;
      cumDiff += scored - conceded;
      return {
        opponent: m.opponent.split(" ").pop() || m.opponent,
        fullOpponent: m.opponent,
        date: m.date,
        goalDiff: cumDiff,
        matchDiff: scored - conceded,
        score: m.score,
        result: m.result,
      };
    }).filter(Boolean);
  }, [data]);

  const registerResult = async (matchId: string, winningTeam: number) => {
    try {
      await api.patch(`/matches/${matchId}/result`, { winning_team: winningTeam });
      toast("Resultat registreret", "success");
      loadData();
    } catch {
      toast("Kunne ikke registrere resultat", "error");
    }
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

  if (loading) {
    return (
      <div data-testid="page-analysis">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.analysis.title}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="py-4">
              <div className="h-8 bg-zinc-800 rounded animate-pulse" />
            </CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-analysis">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.analysis.title}</h1>
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
      <h1 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.analysis.title}</h1>

      {/* Pending Matches - Post Match Card */}
      {pendingMatches.length > 0 && role === "admin" && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Afventende kampe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="analysis-pending-matches">
              {pendingMatches.map((m) => {
                const team1 = m.players.filter((p) => p.team === 1);
                const team2 = m.players.filter((p) => p.team === 2);

                if (activePostMatch === m.id) {
                  return (
                    <PostMatchCard
                      key={m.id}
                      match={m}
                      onComplete={() => { setActivePostMatch(null); loadData(); }}
                      onCancel={() => setActivePostMatch(null)}
                    />
                  );
                }

                return (
                  <div key={m.id} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50 transition-all duration-200 hover:border-zinc-700" data-testid={`pending-match-${m.id}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                      <span className="text-sm text-zinc-400">{m.date}</span>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => setActivePostMatch(m.id)}
                          data-testid={`complete-match-${m.id}`}
                        >
                          <ClipboardList className="w-3.5 h-3.5 mr-1" />
                          {da.postMatch.title}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
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
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => deleteMatch(m.id)}
                          data-testid={`delete-match-${m.id}`}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-zinc-200 mb-1 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-zinc-500" /> Hold 1
                        </p>
                        {team1.map((p) => (
                          <p key={p.player_id} className="text-zinc-400 pl-5">{p.display_name}</p>
                        ))}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-200 mb-1 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-zinc-500" /> Hold 2
                        </p>
                        {team2.map((p) => (
                          <p key={p.player_id} className="text-zinc-400 pl-5">{p.display_name}</p>
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

      {/* DBU Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 animate-stagger" data-testid="analysis-summary">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-4 pb-4 text-center">
              <card.icon className={`w-5 h-5 ${card.color} mx-auto mb-2 opacity-60`} />
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{card.label}</p>
              <p className={`text-2xl font-bold tabular-nums mt-1 ${card.color}`}>{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Season Overview */}
      {seasonOverview && data.dbuSummary.total > 0 && (
        <Card className="mb-6" data-testid="analysis-season-overview">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-400" />
              {da.analysis.seasonOverview}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-stagger">
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{da.analysis.winRatePct}</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">{seasonOverview.winPct}%</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{da.analysis.goalsScored}</p>
                <p className="text-xl font-bold text-emerald-400 tabular-nums">{seasonOverview.goalsScored}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{da.analysis.goalsConceded}</p>
                <p className="text-xl font-bold text-red-400 tabular-nums">{seasonOverview.goalsConceded}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{da.analysis.cleanSheetsTotal}</p>
                <p className="text-xl font-bold text-sky-400 tabular-nums">{seasonOverview.cleanSheets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal Difference Trend */}
      {goalDiffTrend.length > 1 && (
        <Card className="mb-6" data-testid="analysis-goal-diff-trend">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              {da.analysis.goalDiffTrend}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={goalDiffTrend} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="goalDiffGradientPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="goalDiffGradientNeg" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis
                  dataKey="opponent"
                  tick={{ fontSize: 10, fill: "#A1A1AA" }}
                  stroke="#3F3F46"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#A1A1AA" }}
                  stroke="#3F3F46"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#27272A",
                    border: "1px solid #3F3F46",
                    borderRadius: "8px",
                    color: "#FAFAFA",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    `${value >= 0 ? "+" : ""}${value}`,
                    da.analysis.goalDiffCumulative,
                  ]}
                  labelFormatter={(label: string, payload: any[]) => {
                    const d = payload?.[0]?.payload;
                    if (!d) return label;
                    return `${d.fullOpponent} (${d.score})`;
                  }}
                />
                {/* Reference line at 0 */}
                <Area
                  type="monotone"
                  dataKey="goalDiff"
                  stroke={goalDiffTrend[goalDiffTrend.length - 1]?.goalDiff >= 0 ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  fill={goalDiffTrend[goalDiffTrend.length - 1]?.goalDiff >= 0 ? "url(#goalDiffGradientPos)" : "url(#goalDiffGradientNeg)"}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const color = payload.goalDiff >= 0 ? "#10b981" : "#ef4444";
                    return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={4} fill={color} stroke="#18181b" strokeWidth={2} />;
                  }}
                  activeDot={{ strokeWidth: 2, stroke: "#fff", r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between mt-2 text-xs text-zinc-500">
              <span>{da.analysis.goalDiffDesc}</span>
              <span className={`font-medium tabular-nums ${goalDiffTrend[goalDiffTrend.length - 1]?.goalDiff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {goalDiffTrend[goalDiffTrend.length - 1]?.goalDiff >= 0 ? "+" : ""}{goalDiffTrend[goalDiffTrend.length - 1]?.goalDiff ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals + Assists Bar Chart */}
      {goalAssistChart.length > 0 && (
        <Card className="mb-6" data-testid="analysis-goals-assists-chart">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              {da.analysis.topScorers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(200, goalAssistChart.length * 36)}>
              <BarChart data={goalAssistChart} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fill: "#d4d4d8", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<GoalAssistTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="goals" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name={da.analysis.goals} />
                <Bar dataKey="assists" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} name={da.analysis.assists} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> {da.analysis.goals}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> {da.analysis.assists}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Timeline */}
      {data.dbuMatches.length > 0 && (
        <Card className="mb-6" data-testid="analysis-form-timeline">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
              {da.analysis.formTimeline}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 items-center">
              {[...data.dbuMatches].reverse().map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <FormDot result={m.result} />
                  <span className="text-[10px] text-zinc-600 truncate max-w-[48px]" title={m.opponent}>
                    {m.opponent.split(" ").pop()}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> {da.analysis.win}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-zinc-500 inline-block" /> {da.analysis.draw}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> {da.analysis.loss}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DBU Matches */}
      {data.dbuMatches.length === 0 ? (
        <Card className="mb-6"><CardContent className="py-8 text-center">
          <p className="text-zinc-500">Ingen DBU-kampe endnu</p>
        </CardContent></Card>
      ) : (
        <Card className="mb-6 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Swords className="w-5 h-5 text-zinc-400" />
              {da.analysis.dbuMatches}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
          </CardContent>
        </Card>
      )}

      {/* Player Match Stats Table */}
      {data.playerStats.length === 0 ? (
        <Card><CardContent className="py-8 text-center">
          <p className="text-zinc-500" data-testid="analysis-no-stats">Ingen spillerstatistik endnu</p>
        </CardContent></Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" />
              {da.analysis.playerStats}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="analysis-player-rates-table">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 text-xs font-medium uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Navn</th>
                  <th className="px-4 py-3 text-center">{da.analysis.goals}</th>
                  <th className="px-4 py-3 text-center">{da.analysis.assists}</th>
                  <th className="px-4 py-3 text-center">{da.analysis.cleanSheets}</th>
                  <th className="px-4 py-3 text-center">{da.analysis.yellowCards}</th>
                  <th className="px-4 py-3 text-center">{da.analysis.redCards}</th>
                </tr>
              </thead>
              <tbody>
                {data.playerStats.map((p) => (
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
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{p.goals}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{p.assists}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">{p.cleanSheets}</td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">
                      {p.yellowCards > 0 ? <span className="text-yellow-400">{p.yellowCards}</span> : 0}
                    </td>
                    <td className="px-4 py-3 text-center text-sm tabular-nums text-zinc-300">
                      {p.redCards > 0 ? <span className="text-red-400">{p.redCards}</span> : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
