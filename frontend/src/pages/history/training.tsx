import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Download, Trophy, Clock, Users, Swords, Plus, X, ClipboardList } from "lucide-react";

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

interface MatchEventDisplay extends MatchEvent {
  display_name?: string;
}

interface PlayerStat {
  id: string;
  display_name: string;
  profile_picture?: string | null;
  matches: number;
  wins: number;
  losses: number;
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

export default function TrainingHistoryPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<PlayerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "10" | "20">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [activePostMatch, setActivePostMatch] = useState<string | null>(null);
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
    try {
      await api.patch(`/matches/${matchId}/result`, { winning_team: winningTeam });
      toast("Resultat registreret", "success");
      loadData();
    } catch {
      toast("Kunne ikke registrere resultat", "error");
    }
  };

  const exportCsv = () => {
    window.open("/api/matches/export/csv", "_blank");
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

      {/* Pending Matches */}
      {pendingMatches.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Afventende kampe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="history-pending-matches">
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
                      {role === "admin" && (
                        <div className="flex gap-2">
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
                        </div>
                      )}
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
