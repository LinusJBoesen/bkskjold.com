import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";
import { useToast } from "@/components/toast";
import { FormationView, autoAssign, type PlayerInfo, type Position } from "@/components/pitch";
import { Users, Shuffle, Save, UserPlus, ClipboardCopy, Check, ArrowRightLeft, Calendar, Trophy, LayoutGrid, List, Search, CheckSquare, Square } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AvailablePlayer {
  id: string;
  displayName: string;
  profilePicture?: string | null;
  winRate: number;
  matches: number;
}

interface EventInfo {
  heading: string;
  date: string;
  players: AvailablePlayer[];
}

interface AvailableResponse {
  training: EventInfo | null;
  match: EventInfo | null;
  allPlayers: AvailablePlayer[];
}

interface PlayerStats {
  id: string;
  displayName: string;
  winRate: number;
  matches: number;
  wins: number;
  losses: number;
}

interface TeamResult {
  team1: PlayerStats[];
  team2: PlayerStats[];
  balance: {
    team1Strength: number;
    team2Strength: number;
    difference: number;
    balancePercent: number;
  };
}

function PlayerAvatar({ name, src, size = "sm" }: { name: string; src?: string | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 sm:h-7 sm:w-7" : "h-10 w-10 sm:h-9 sm:w-9";
  const textSize = size === "sm" ? "text-[11px] sm:text-[10px]" : "text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${dim} rounded-full object-cover border border-zinc-700 shrink-0`}
      />
    );
  }

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`${dim} rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center ${textSize} font-medium text-zinc-400 shrink-0`}>
      {initials}
    </div>
  );
}

const POSITION_LABELS: Record<string, { short: string; color: string }> = {
  keeper: { short: "MV", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  defender: { short: "F", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  wing: { short: "K", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  midfield: { short: "C", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  attacker: { short: "A", color: "text-red-400 bg-red-400/10 border-red-400/20" },
};

function PositionBadges({ positions }: { positions: string[] }) {
  if (positions.length === 0) return null;
  return (
    <div className="flex gap-0.5 shrink-0">
      {positions.slice(0, 2).map((pos) => {
        const label = POSITION_LABELS[pos];
        if (!label) return null;
        return (
          <span
            key={pos}
            className={`text-[9px] font-bold px-1 py-0.5 rounded border leading-none ${label.color}`}
            title={da.formation[pos as keyof typeof da.formation] ?? pos}
          >
            {label.short}
          </span>
        );
      })}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];
  const day = days[d.getDay()];
  return `${day}. ${d.getDate()}/${d.getMonth() + 1} kl. ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

type ActiveTab = "training" | "match";
type ViewMode = "list" | "formation";

export default function TeamSelectorPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [data, setData] = useState<AvailableResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("training");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [guestName, setGuestName] = useState("");
  const [guests, setGuests] = useState<string[]>([]);
  const [result, setResult] = useState<TeamResult | null>(null);

  const [savingLineup, setSavingLineup] = useState(false);
  const [savedLineup, setSavedLineup] = useState(false);
  const [savedLineupId, setSavedLineupId] = useState<string | null>(null);
  const [winnerSubmitting, setWinnerSubmitting] = useState(false);
  const [winnerDone, setWinnerDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishedLineup, setPublishedLineup] = useState<{ id: string; label: string; team1: { id: string; displayName: string; profilePicture?: string | null }[]; team2: { id: string; displayName: string; profilePicture?: string | null }[]; createdAt: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [formationTeam, setFormationTeam] = useState<1 | 2>(1);
  const [playerPositions, setPlayerPositions] = useState<Record<string, Position[]>>({});
  const [playerSearch, setPlayerSearch] = useState("");
  const { toast } = useToast();

  // Match squad state (starters + bench, no two-team split)
  type SquadPlayer = { id: string; displayName: string; profilePicture?: string | null; winRate: number };
  const [matchSquad, setMatchSquad] = useState<{ starters: SquadPlayer[]; bench: SquadPlayer[] } | null>(null);
  const [savingSquad, setSavingSquad] = useState(false);
  const [savedSquad, setSavedSquad] = useState(false);
  const [publishedMatchLineup, setPublishedMatchLineup] = useState<{ id: string; label: string; starters: SquadPlayer[]; bench: SquadPlayer[] } | null>(null);

  useEffect(() => {
    api.get<AvailableResponse>("/teams/available")
      .then((res) => {
        setData(res);
        const trainingPlayers = res.training?.players ?? [];
        const matchPlayers = res.match?.players ?? [];
        if (trainingPlayers.length > 0) {
          setActiveTab("training");
          setSelected(new Set(trainingPlayers.map((p) => p.id)));
        } else if (matchPlayers.length > 0) {
          setActiveTab("match");
          setSelected(new Set(matchPlayers.map((p) => p.id)));
        } else {
          setSelected(new Set(res.allPlayers.map((p) => p.id)));
        }
      })
      .catch(() => setError("Kunne ikke indlæse spillere"))
      .finally(() => setLoading(false));

    // Load the latest published training lineup
    api.get<{ lineup: typeof publishedLineup }>("/teams/lineup")
      .then((res) => setPublishedLineup(res.lineup))
      .catch(() => {/* optional */});

    // Load the latest published match lineup
    api.get<{ lineup: typeof publishedMatchLineup }>("/teams/match-lineup")
      .then((res) => setPublishedMatchLineup(res.lineup))
      .catch(() => {/* optional */});

    // Load player positions for formation auto-assignment
    api.get<{ id: string; displayName: string; profilePicture: string | null; positions: string[] }[]>("/formations/players/positions")
      .then((res) => {
        const posMap: Record<string, Position[]> = {};
        for (const p of res) {
          posMap[p.id] = p.positions as Position[];
        }
        setPlayerPositions(posMap);
      })
      .catch(() => {/* positions are optional */});
  }, []);

  const switchTab = (tab: ActiveTab) => {
    if (!data) return;
    setActiveTab(tab);
    setResult(null);
    setMatchSquad(null);
    setSavedLineup(false);
    setSavedLineupId(null);
    setSavedSquad(false);
    setWinnerDone(false);
    setCopied(false);
    setGuests([]);
    setViewMode("list");
    const players = tab === "training"
      ? (data.training?.players ?? [])
      : (data.match?.players ?? []);
    if (players.length > 0) {
      setSelected(new Set(players.map((p) => p.id)));
    } else {
      setSelected(new Set(data.allPlayers.map((p) => p.id)));
    }
  };

  const currentEvent = activeTab === "training" ? data?.training : data?.match;
  const spondPlayers = currentEvent?.players ?? [];
  const spondPlayerIds = new Set(spondPlayers.map((p) => p.id));
  // All players not in the Spond-accepted list
  const otherPlayers = (data?.allPlayers ?? []).filter((p) => !spondPlayerIds.has(p.id));
  const allPlayersList = [...spondPlayers, ...otherPlayers, ...(data?.allPlayers ?? [])].filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );

  // Filter players by search term
  const filteredSpondPlayers = useMemo(() => {
    if (!playerSearch.trim()) return spondPlayers;
    const q = playerSearch.toLowerCase();
    return spondPlayers.filter((p) => p.displayName.toLowerCase().includes(q));
  }, [spondPlayers, playerSearch]);

  const filteredOtherPlayers = useMemo(() => {
    if (!playerSearch.trim()) return otherPlayers;
    const q = playerSearch.toLowerCase();
    return otherPlayers.filter((p) => p.displayName.toLowerCase().includes(q));
  }, [otherPlayers, playerSearch]);

  const selectAll = () => {
    const all = new Set(allPlayersList.map((p) => p.id));
    setSelected(all);
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const addGuest = () => {
    if (guestName.trim()) {
      setGuests([...guests, guestName.trim()]);
      setGuestName("");
    }
  };

  const togglePlayer = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (activeTab === "match" && next.size >= 10) return;
      next.add(id);
    }
    setSelected(next);
  };

  const generateTeams = async () => {
    const playerIds = [
      ...Array.from(selected),
      ...guests.map((_, i) => `guest-${i}-${guests[i]}`),
    ];
    // Send position data so the algorithm can balance by position distribution
    const positionsPayload: Record<string, string[]> = {};
    for (const id of playerIds) {
      if (playerPositions[id]?.length) {
        positionsPayload[id] = playerPositions[id] as string[];
      }
    }
    try {
      const res = await api.post<TeamResult>("/teams/generate", { playerIds, algorithm: "greedy", positions: positionsPayload });
      setResult(res);
      setCopied(false);
      toast("Hold genereret", "success");
    } catch {
      toast("Kunne ikke generere hold", "error");
    }
  };

  const generateMatchSquad = () => {
    const players = Array.from(selected)
      .map((id) => allPlayersList.find((p) => p.id === id))
      .filter((p): p is AvailablePlayer => !!p)
      .sort((a, b) => b.winRate - a.winRate);
    const starters = players.slice(0, 7).map((p) => ({ id: p.id, displayName: p.displayName, profilePicture: p.profilePicture ?? null, winRate: p.winRate }));
    const bench = players.slice(7, 10).map((p) => ({ id: p.id, displayName: p.displayName, profilePicture: p.profilePicture ?? null, winRate: p.winRate }));
    setMatchSquad({ starters, bench });
    setSavedSquad(false);
    toast("Opstilling klar", "success");
  };

  const moveToStarters = (playerId: string) => {
    if (!matchSquad) return;
    const player = matchSquad.bench.find((p) => p.id === playerId);
    if (!player || matchSquad.starters.length >= 7) return;
    setMatchSquad({
      starters: [...matchSquad.starters, player],
      bench: matchSquad.bench.filter((p) => p.id !== playerId),
    });
  };

  const moveToBench = (playerId: string) => {
    if (!matchSquad) return;
    const player = matchSquad.starters.find((p) => p.id === playerId);
    if (!player || matchSquad.bench.length >= 3) return;
    setMatchSquad({
      starters: matchSquad.starters.filter((p) => p.id !== playerId),
      bench: [...matchSquad.bench, player],
    });
  };

  const saveMatchSquad = async () => {
    if (!matchSquad) return;
    setSavingSquad(true);
    try {
      await api.post("/teams/match-lineup", {
        eventDate: currentEvent?.date ?? new Date().toISOString(),
        starters: matchSquad.starters,
        bench: matchSquad.bench,
      });
      setSavedSquad(true);
      const res = await api.get<{ lineup: typeof publishedMatchLineup }>("/teams/match-lineup");
      setPublishedMatchLineup(res.lineup);
      toast("Kamptrup gemt — spillere kan nu se opstillingen", "success");
    } catch {
      toast("Kunne ikke gemme kamptrup", "error");
    }
    setSavingSquad(false);
  };

  const swapPlayer = async (playerId: string) => {
    if (!result) return;
    try {
      const res = await api.post<TeamResult>("/teams/swap", {
        team1: result.team1,
        team2: result.team2,
        playerId,
      });
      setResult(res);
    } catch {
      toast("Kunne ikke bytte spiller", "error");
    }
  };


  const saveTrainingLineup = async () => {
    if (!result) return;
    setSavingLineup(true);
    try {
      const saved = await api.post<{ id: string; label: string }>("/teams/lineup", {
        eventDate: currentEvent?.date ?? new Date().toISOString(),
        team1: result.team1.map((p) => ({ id: p.id, displayName: p.displayName, profilePicture: getPlayerPicture(p.id) })),
        team2: result.team2.map((p) => ({ id: p.id, displayName: p.displayName, profilePicture: getPlayerPicture(p.id) })),
      });
      setSavedLineup(true);
      setSavedLineupId(saved.id);
      const res = await api.get<{ lineup: typeof publishedLineup }>("/teams/lineup");
      setPublishedLineup(res.lineup);
      toast("Holdopstilling gemt — spillere kan nu se holdene", "success");
    } catch {
      toast("Kunne ikke gemme holdopstilling", "error");
    }
    setSavingLineup(false);
  };

  const submitWinner = async (winner: 1 | 2) => {
    if (!savedLineupId) return;
    setWinnerSubmitting(true);
    try {
      await api.post(`/teams/lineup/${savedLineupId}/result`, { winner });
      setWinnerDone(true);
      toast(`Hold ${winner} vandt — bøder tildelt taberne og fraværende`, "success");
    } catch {
      toast("Kunne ikke gemme resultat", "error");
    }
    setWinnerSubmitting(false);
  };

  const copyTeams = async () => {
    if (!result) return;
    const text = [
      "⚽ Hold 1",
      ...result.team1.map(p => `  ${p.displayName} (${Math.round(p.winRate * 100)}%)`),
      "",
      "⚽ Hold 2",
      ...result.team2.map(p => `  ${p.displayName} (${Math.round(p.winRate * 100)}%)`),
      "",
      `Balance: ${result.balance.balancePercent}%`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Kopieret til udklipsholder", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Kunne ikke kopiere", "error");
    }
  };

  // Compute position distribution for generated teams
  const teamPositionSummary = useMemo(() => {
    if (!result) return null;
    const countPositions = (team: PlayerStats[]) => {
      const counts: Record<string, number> = {};
      for (const p of team) {
        for (const pos of (playerPositions[p.id] ?? [])) {
          counts[pos] = (counts[pos] ?? 0) + 1;
        }
      }
      return counts;
    };
    return {
      team1: countPositions(result.team1),
      team2: countPositions(result.team2),
    };
  }, [result, playerPositions]);

  const winRateColor = (rate: number) => {
    if (rate > 0.5) return "text-emerald-400";
    if (rate < 0.5) return "text-red-400";
    return "text-zinc-400";
  };

  const getPlayerPicture = (id: string) => {
    return allPlayersList.find(p => p.id === id)?.profilePicture;
  };

  // Build PlayerInfo list for formation view
  const getFormationPlayers = (team: PlayerStats[]): PlayerInfo[] => {
    return team.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      profilePicture: getPlayerPicture(p.id),
      positions: playerPositions[p.id] ?? [],
    }));
  };

  if (loading) {
    return (
      <div data-testid="page-teams">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.nav.teams}</h1>
        <Card><CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        </CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-teams">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.nav.teams}</h1>
        <Card><CardContent className="py-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Prøv igen</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div data-testid="page-teams" className="animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Users className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">{da.nav.teams}</h1>
          <p className="text-sm text-zinc-500">Generer balancerede hold til træning eller kamp</p>
        </div>
      </div>

      {/* Event Tabs — stack on mobile, side-by-side on larger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => switchTab("training")}
          className={`flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "training"
              ? "bg-emerald-500/10 text-emerald-400 border-2 border-emerald-500/30"
              : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <Calendar className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
          <div className="text-left">
            <div className="text-base sm:text-sm">Træning</div>
            {data?.training ? (
              <div className="text-xs opacity-70">{formatDate(data.training.date)} — {data.training.players.length} tilmeldt</div>
            ) : (
              <div className="text-xs opacity-70">Ingen planlagt</div>
            )}
          </div>
        </button>
        <button
          onClick={() => switchTab("match")}
          className={`flex items-center gap-3 px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "match"
              ? "bg-blue-500/10 text-blue-400 border-2 border-blue-500/30"
              : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <Trophy className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
          <div className="text-left">
            <div className="text-base sm:text-sm">Kamp</div>
            {data?.match ? (
              <div className="text-xs opacity-70">{formatDate(data.match.date)} — {data.match.players.length} tilmeldt</div>
            ) : (
              <div className="text-xs opacity-70">Ingen planlagt</div>
            )}
          </div>
        </button>
      </div>

      {/* Event info banner */}
      {currentEvent && (
        <div className={`mb-6 rounded-lg px-4 py-3 border text-sm ${
          activeTab === "training"
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
            : "bg-blue-500/5 border-blue-500/20 text-blue-300"
        }`}>
          <span className="font-medium">{currentEvent.heading}</span>
          <span className="mx-2 opacity-50">·</span>
          <span className="opacity-80">{formatDate(currentEvent.date)}</span>
          {currentEvent.players.length > 0 && (
            <>
              <span className="mx-2 opacity-50">·</span>
              <span className="opacity-80">{currentEvent.players.length} har svaret ja</span>
            </>
          )}
        </div>
      )}

      {/* Player view */}
      {!isAdmin && (
        <div className="mt-2">
          {activeTab === "training" ? (
            publishedLineup ? (
              <>
                <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400">
                  <Users className="h-4 w-4" />
                  <span>Holdopstilling til <span className="text-zinc-200 font-medium">{publishedLineup.label}</span></span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-white/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-white border border-zinc-300 flex items-center justify-center text-xs font-bold text-zinc-900">1</div>
                        Hold 1
                        <span className="text-sm font-medium text-zinc-300 ml-1">— Hvide trøjer</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {publishedLineup.team1.map((p) => (
                          <div key={p.id} className="flex items-center gap-2.5 text-sm py-1.5 px-2 rounded-lg">
                            <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                            <span className="text-zinc-200">{p.displayName}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-zinc-600 bg-zinc-950">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-zinc-900 border border-zinc-500 flex items-center justify-center text-xs font-bold text-zinc-100">2</div>
                        Hold 2
                        <span className="text-sm font-medium text-zinc-300 ml-1">— Sorte trøjer</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {publishedLineup.team2.map((p) => (
                          <div key={p.id} className="flex items-center gap-2.5 text-sm py-1.5 px-2 rounded-lg">
                            <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                            <span className="text-zinc-200">{p.displayName}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-6">
                  <p className="text-zinc-400 text-sm font-medium mb-4">Ingen holdopstilling er delt endnu</p>
                  <p className="text-zinc-600 text-xs">Træneren gemmer holdene her inden træning</p>
                </CardContent>
              </Card>
            )
          ) : (
            publishedMatchLineup ? (
              <>
                <div className="mb-4 flex items-center gap-2 text-sm text-zinc-400">
                  <Trophy className="h-4 w-4" />
                  <span>Kamptrup til <span className="text-zinc-200 font-medium">{publishedMatchLineup.label}</span></span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-blue-400" />
                        Startende 7
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {publishedMatchLineup.starters.map((p) => (
                          <div key={p.id} className="flex items-center gap-2.5 text-sm py-1.5 px-2 rounded-lg">
                            <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                            <span className="text-zinc-200">{p.displayName}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-zinc-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-zinc-400" />
                        Bænk
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {publishedMatchLineup.bench.map((p) => (
                          <div key={p.id} className="flex items-center gap-2.5 text-sm py-1.5 px-2 rounded-lg">
                            <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                            <span className="text-zinc-300">{p.displayName}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-6">
                  <p className="text-zinc-400 text-sm font-medium mb-4">Ingen kamptrup er delt endnu</p>
                  <p className="text-zinc-600 text-xs">Træneren gemmer kamptruppen her inden kamp</p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* View mode toggle (shown after teams generated for training, or squad generated for match) */}
      {isAdmin && (result || matchSquad) && (
        <div className="flex items-center gap-2 mb-4" data-testid="view-mode-toggle">
          <div className="flex rounded-lg border border-zinc-700 bg-zinc-900/50 overflow-hidden">
            <button
              data-testid="view-mode-list"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list"
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Liste
            </button>
            <button
              data-testid="view-mode-formation"
              onClick={() => setViewMode("formation")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "formation"
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Opstilling
            </button>
          </div>

          {/* Team toggle only for training (two teams) */}
          {activeTab === "training" && viewMode === "formation" && result && (
            <div className="flex rounded-lg border border-zinc-700 bg-zinc-900/50 overflow-hidden ml-2">
              <button
                data-testid="formation-team-1"
                onClick={() => setFormationTeam(1)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  formationTeam === 1
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                Hold 1
              </button>
              <button
                data-testid="formation-team-2"
                onClick={() => setFormationTeam(2)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  formationTeam === 2
                    ? "bg-amber-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                Hold 2
              </button>
            </div>
          )}
        </div>
      )}

      {/* Formation View — training */}
      {isAdmin && activeTab === "training" && result && viewMode === "formation" && (
        <FormationView
          key={formationTeam}
          players={getFormationPlayers(formationTeam === 1 ? result.team1 : result.team2)}
          teamNumber={formationTeam}
          initialAssignments={autoAssign(
            getFormationPlayers(formationTeam === 1 ? result.team1 : result.team2),
            "1-2-3-1"
          )}
        />
      )}

      {/* Formation View — match (all 10 players: 7 on pitch, 3 on bench) */}
      {isAdmin && activeTab === "match" && matchSquad && viewMode === "formation" && (
        <FormationView
          key="match-formation"
          players={[...matchSquad.starters, ...matchSquad.bench].map((p) => ({
            id: p.id,
            displayName: p.displayName,
            profilePicture: p.profilePicture,
            positions: playerPositions[p.id] ?? [],
          }))}
          teamNumber={1}
          initialAssignments={autoAssign(
            [...matchSquad.starters, ...matchSquad.bench].map((p) => ({
              id: p.id,
              displayName: p.displayName,
              profilePicture: p.profilePicture,
              positions: playerPositions[p.id] ?? [],
            })),
            "1-2-3-1"
          )}
        />
      )}

      {/* List View (admin only) */}
      {isAdmin && (viewMode === "list" || (activeTab === "training" ? !result : !matchSquad)) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4 text-zinc-400" />
                  Spillere
                </CardTitle>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500">
                    {selected.size + guests.length} valgt
                    {spondPlayers.length > 0 ? (
                      <span className="ml-1.5 text-emerald-400">({spondPlayers.length} tilmeldt via Spond)</span>
                    ) : null}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={selectAll}
                      className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors px-1.5 py-0.5 rounded"
                      data-testid="team-select-all"
                    >
                      <CheckSquare className="h-3 w-3" />
                      Alle
                    </button>
                    <button
                      onClick={deselectAll}
                      className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors px-1.5 py-0.5 rounded"
                      data-testid="team-deselect-all"
                    >
                      <Square className="h-3 w-3" />
                      Ingen
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search filter */}
                <div className="relative mb-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Søg spiller..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                    data-testid="team-player-search"
                  />
                </div>

                {allPlayersList.length === 0 && guests.length === 0 ? (
                  <p className="text-sm text-zinc-500" data-testid="team-empty-state">Ingen spillere tilgængelige</p>
                ) : (
                  <div className="space-y-0.5 max-h-[32rem] overflow-y-auto pr-1 -mx-1" data-testid="team-available-players">
                    {/* Spond-accepted players */}
                    {filteredSpondPlayers.length > 0 && (
                      <>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400/70 px-3 pt-1 pb-1">
                          Tilmeldt
                        </div>
                        {filteredSpondPlayers.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-3 text-sm cursor-pointer rounded-lg px-3 py-2.5 sm:py-1.5 hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(p.id)}
                              onChange={() => togglePlayer(p.id)}
                              className="accent-red-500 rounded h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0"
                            />
                            <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                            <span className="text-zinc-200 truncate min-w-0">{p.displayName}</span>
                            <div className="ml-auto flex items-center gap-1.5 shrink-0">
                              <PositionBadges positions={playerPositions[p.id] ?? []} />
                              <span className={`tabular-nums text-xs font-medium ${winRateColor(p.winRate)}`}>
                                {Math.round(p.winRate * 100)}%
                              </span>
                            </div>
                          </label>
                        ))}
                      </>
                    )}

                    {/* Other players (not signed up on Spond) */}
                    {filteredOtherPlayers.length > 0 && (
                      <>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 px-3 pt-3 pb-1 border-t border-zinc-800/50 mt-1">
                          {spondPlayers.length > 0 ? "Ikke tilmeldt" : "Alle spillere"}
                        </div>
                        {filteredOtherPlayers.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-3 text-sm cursor-pointer rounded-lg px-3 py-2.5 sm:py-1.5 hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors opacity-70 hover:opacity-100"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(p.id)}
                              onChange={() => togglePlayer(p.id)}
                              className="accent-red-500 rounded h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0"
                            />
                            <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                            <span className="text-zinc-400 truncate min-w-0">{p.displayName}</span>
                            <div className="ml-auto flex items-center gap-1.5 shrink-0">
                              <PositionBadges positions={playerPositions[p.id] ?? []} />
                              <span className={`tabular-nums text-xs font-medium ${winRateColor(p.winRate)}`}>
                                {Math.round(p.winRate * 100)}%
                              </span>
                            </div>
                          </label>
                        ))}
                      </>
                    )}

                    {/* Fallback: if no Spond event, show all players normally */}
                    {filteredSpondPlayers.length === 0 && filteredOtherPlayers.length === 0 && !playerSearch.trim() && (data?.allPlayers ?? []).map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 text-sm cursor-pointer rounded-lg px-3 py-2.5 sm:py-1.5 hover:bg-white/[0.04] active:bg-white/[0.07] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => togglePlayer(p.id)}
                          className="accent-red-500 rounded h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0"
                        />
                        <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                        <span className="text-zinc-200 truncate min-w-0">{p.displayName}</span>
                        <div className="ml-auto flex items-center gap-1.5 shrink-0">
                          <PositionBadges positions={playerPositions[p.id] ?? []} />
                          <span className={`tabular-nums text-xs font-medium ${winRateColor(p.winRate)}`}>
                            {Math.round(p.winRate * 100)}%
                          </span>
                        </div>
                      </label>
                    ))}

                    {/* No results for search */}
                    {playerSearch.trim() && filteredSpondPlayers.length === 0 && filteredOtherPlayers.length === 0 && (
                      <p className="text-xs text-zinc-600 px-3 py-2">Ingen spillere matcher "{playerSearch}"</p>
                    )}

                    {guests.map((g, i) => (
                      <div key={`guest-${i}`} className="flex items-center gap-3 text-sm text-zinc-500 px-3 py-2.5 sm:py-1.5">
                        <input type="checkbox" checked disabled className="accent-red-500 h-4 w-4 sm:h-3.5 sm:w-3.5 shrink-0" />
                        <div className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] sm:text-[10px] font-medium text-zinc-500 shrink-0">
                          G
                        </div>
                        <span className="truncate">Gæst: {g}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Gæstenavn..."
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addGuest()}
                    data-testid="team-guest-input"
                    className="flex-1"
                  />
                  <Button variant="secondary" onClick={addGuest} data-testid="team-add-guest">
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Tilføj gæst
                  </Button>
                </div>

                {isAdmin && activeTab === "match" && selected.size > 0 && (
                  <p className={`text-xs mt-3 ${selected.size > 10 ? "text-red-400" : selected.size === 10 ? "text-amber-400" : "text-zinc-500"}`}>
                    {selected.size}/10 valgt · 7 starter + {Math.min(Math.max(selected.size - 7, 0), 3)} bænk
                  </p>
                )}
                {isAdmin && (
                  <Button
                    className="w-full mt-4"
                    onClick={activeTab === "match" ? generateMatchSquad : generateTeams}
                    disabled={activeTab === "match" ? selected.size < 1 : selected.size + guests.length < 2}
                    data-testid="team-generate-button"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    {activeTab === "match" ? "Lav opstilling" : "Generer hold"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Generated Teams */}
            {result && (
              <>
                <Card className="border-white/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white border border-zinc-300 flex items-center justify-center text-xs font-bold text-zinc-900">1</div>
                      Hold 1
                      <span className="text-sm font-medium text-zinc-300 ml-1">— Hvide trøjer</span>
                    </CardTitle>
                    <p className="text-xs text-zinc-500">
                      Styrke: <span className="text-zinc-300 font-medium">{result.balance.team1Strength}</span>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1" data-testid="team-1-players">
                      {result.team1.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm rounded-lg px-2 py-2.5 sm:py-1.5 hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <PlayerAvatar name={p.displayName} src={getPlayerPicture(p.id)} />
                            <span className="text-zinc-200">{p.displayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`tabular-nums text-xs font-medium ${winRateColor(p.winRate)}`}>
                              {Math.round(p.winRate * 100)}%
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => swapPlayer(p.id)}
                              data-testid={`team-swap-${p.id}`}
                              className="h-8 w-8 sm:h-6 sm:w-6 p-0"
                            >
                              <ArrowRightLeft className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-600 bg-zinc-950">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-zinc-900 border border-zinc-500 flex items-center justify-center text-xs font-bold text-zinc-100">2</div>
                      Hold 2
                      <span className="text-sm font-medium text-zinc-300 ml-1">— Sorte trøjer</span>
                    </CardTitle>
                    <p className="text-xs text-zinc-500">
                      Styrke: <span className="text-zinc-300 font-medium">{result.balance.team2Strength}</span>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1" data-testid="team-2-players">
                      {result.team2.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm rounded-lg px-2 py-2.5 sm:py-1.5 hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <PlayerAvatar name={p.displayName} src={getPlayerPicture(p.id)} />
                            <span className="text-zinc-200">{p.displayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`tabular-nums text-xs font-medium ${winRateColor(p.winRate)}`}>
                              {Math.round(p.winRate * 100)}%
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => swapPlayer(p.id)}
                              data-testid={`team-swap-${p.id}`}
                              className="h-8 w-8 sm:h-6 sm:w-6 p-0"
                            >
                              <ArrowRightLeft className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {result && activeTab === "training" && (
            <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="text-sm text-zinc-300" data-testid="team-balance">
                    Balance: <span className="font-bold text-zinc-50">{result.balance.balancePercent}%</span>
                    <span className="text-zinc-500 ml-2">(forskel: {result.balance.difference})</span>
                  </div>
                  {teamPositionSummary && Object.keys({ ...teamPositionSummary.team1, ...teamPositionSummary.team2 }).length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500" data-testid="team-position-summary">
                      {(["keeper", "defender", "wing", "midfield", "attacker"] as const)
                        .filter((pos) => (teamPositionSummary.team1[pos] ?? 0) + (teamPositionSummary.team2[pos] ?? 0) > 0)
                        .map((pos) => {
                          const label = POSITION_LABELS[pos];
                          const c1 = teamPositionSummary.team1[pos] ?? 0;
                          const c2 = teamPositionSummary.team2[pos] ?? 0;
                          return (
                            <span key={pos} className="flex items-center gap-1">
                              <span className={`text-[9px] font-bold px-1 py-0.5 rounded border leading-none ${label.color}`}>{label.short}</span>
                              <span>{c1}–{c2}</span>
                            </span>
                          );
                        })}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={copyTeams} data-testid="team-copy-button">
                    {copied ? <Check className="h-4 w-4 mr-1.5" /> : <ClipboardCopy className="h-4 w-4 mr-1.5" />}
                    {copied ? "Kopieret!" : "Kopiér hold"}
                  </Button>
                  <Button
                    onClick={saveTrainingLineup}
                    disabled={savingLineup || savedLineup}
                    data-testid="team-save-lineup-button"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {savedLineup ? "Gemt!" : savingLineup ? "Gemmer..." : "Gem træningshold"}
                  </Button>
                </div>
              </div>

              {/* Winner selection — shown after lineup is saved */}
              {savedLineup && !winnerDone && (
                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-sm text-zinc-400 mb-3">Hvem vandt træningskampen?</p>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => submitWinner(1)}
                      disabled={winnerSubmitting}
                      data-testid="winner-team-1"
                      className="flex-1 border-white/20 hover:border-white/40 hover:bg-white/5"
                    >
                      <div className="h-5 w-5 rounded-full bg-white border border-zinc-300 flex items-center justify-center text-[10px] font-bold text-zinc-900 mr-2">1</div>
                      Hold 1 vandt
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => submitWinner(2)}
                      disabled={winnerSubmitting}
                      data-testid="winner-team-2"
                      className="flex-1 border-zinc-600 hover:border-zinc-400"
                    >
                      <div className="h-5 w-5 rounded-full bg-zinc-900 border border-zinc-500 flex items-center justify-center text-[10px] font-bold text-zinc-100 mr-2">2</div>
                      Hold 2 vandt
                    </Button>
                  </div>
                </div>
              )}

              {winnerDone && (
                <div className="border-t border-zinc-800 pt-4 flex items-center gap-2 text-sm text-emerald-400">
                  <Check className="h-4 w-4" />
                  Resultat gemt — bøder tildelt automatisk
                </div>
              )}
            </div>
          )}

          {/* Match squad result */}
          {matchSquad && activeTab === "match" && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-blue-500/20 bg-blue-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-blue-400" />
                      Startende 7
                      <span className="text-xs text-zinc-500 ml-auto">{matchSquad.starters.length}/7</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1" data-testid="match-starters">
                      {matchSquad.starters.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
                          <div className="flex items-center gap-2.5">
                            <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                            <span className="text-zinc-200">{p.displayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`tabular-nums text-xs font-medium ${winRateColor(p.winRate)}`}>
                              {Math.round(p.winRate * 100)}%
                            </span>
                            {matchSquad.bench.length < 3 && (
                              <Button variant="ghost" size="sm" onClick={() => moveToBench(p.id)} className="h-8 w-8 sm:h-6 sm:w-6 p-0" title="Flyt til bænk">
                                <ArrowRightLeft className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-zinc-400" />
                      Bænk
                      <span className="text-xs text-zinc-500 ml-auto">{matchSquad.bench.length}/3</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1" data-testid="match-bench">
                      {matchSquad.bench.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm rounded-lg px-2 py-1.5 hover:bg-white/[0.03]">
                          <div className="flex items-center gap-2.5">
                            <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                            <span className="text-zinc-300">{p.displayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`tabular-nums text-xs font-medium ${winRateColor(p.winRate)}`}>
                              {Math.round(p.winRate * 100)}%
                            </span>
                            {matchSquad.starters.length < 7 && (
                              <Button variant="ghost" size="sm" onClick={() => moveToStarters(p.id)} className="h-8 w-8 sm:h-6 sm:w-6 p-0" title="Flyt til startende">
                                <ArrowRightLeft className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {matchSquad.bench.length === 0 && (
                        <p className="text-xs text-zinc-600 px-2">Ingen bænkspillere</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex justify-end">
                <Button
                  onClick={saveMatchSquad}
                  disabled={savingSquad || savedSquad}
                  data-testid="match-save-squad-button"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {savedSquad ? "Gemt!" : savingSquad ? "Gemmer..." : "Gem kamptrup"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
