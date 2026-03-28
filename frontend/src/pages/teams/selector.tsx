import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";
import { useToast } from "@/components/toast";
import { FormationView, autoAssign, type PlayerInfo, type Position } from "@/components/pitch";
import { Users, Shuffle, Save, UserPlus, ClipboardCopy, Check, ArrowRightLeft, Calendar, Trophy, LayoutGrid, List } from "lucide-react";
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
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${dim} rounded-full object-cover border border-zinc-700`}
      />
    );
  }

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={`${dim} rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center ${textSize} font-medium text-zinc-400`}>
      {initials}
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingLineup, setSavingLineup] = useState(false);
  const [savedLineup, setSavedLineup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [publishedLineup, setPublishedLineup] = useState<{ id: string; label: string; team1: { id: string; displayName: string; profilePicture?: string | null }[]; team2: { id: string; displayName: string; profilePicture?: string | null }[]; createdAt: string } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [formationTeam, setFormationTeam] = useState<1 | 2>(1);
  const [playerPositions, setPlayerPositions] = useState<Record<string, Position[]>>({});
  const { toast } = useToast();

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
    setSaved(false);
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

  const addGuest = () => {
    if (guestName.trim()) {
      setGuests([...guests, guestName.trim()]);
      setGuestName("");
    }
  };

  const togglePlayer = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const generateTeams = async () => {
    const playerIds = [
      ...Array.from(selected),
      ...guests.map((_, i) => `guest-${i}-${guests[i]}`),
    ];
    try {
      const res = await api.post<TeamResult>("/teams/generate", { playerIds, algorithm: "greedy" });
      setResult(res);
      setSaved(false);
      setCopied(false);
      toast("Hold genereret", "success");
    } catch {
      toast("Kunne ikke generere hold", "error");
    }
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

  const saveMatch = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await api.post("/matches", {
        team1: result.team1.map((p) => p.id),
        team2: result.team2.map((p) => p.id),
      });
      setSaved(true);
      toast("Kamp gemt", "success");
    } catch {
      toast("Kunne ikke gemme kamp", "error");
    }
    setSaving(false);
  };

  const saveTrainingLineup = async () => {
    if (!result || !currentEvent) return;
    setSavingLineup(true);
    try {
      await api.post("/teams/lineup", {
        eventDate: currentEvent.date,
        team1: result.team1.map((p) => ({ id: p.id, displayName: p.displayName, profilePicture: getPlayerPicture(p.id) })),
        team2: result.team2.map((p) => ({ id: p.id, displayName: p.displayName, profilePicture: getPlayerPicture(p.id) })),
      });
      setSavedLineup(true);
      const res = await api.get<{ lineup: typeof publishedLineup }>("/teams/lineup");
      setPublishedLineup(res.lineup);
      toast("Holdopstilling gemt — spillere kan nu se holdene", "success");
    } catch {
      toast("Kunne ikke gemme holdopstilling", "error");
    }
    setSavingLineup(false);
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

      {/* Event Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchTab("training")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "training"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <div className="text-left">
            <div>Næste træning</div>
            {data?.training ? (
              <div className="text-xs opacity-70">{formatDate(data.training.date)} — {data.training.players.length} tilmeldt</div>
            ) : (
              <div className="text-xs opacity-70">Ingen planlagt</div>
            )}
          </div>
        </button>
        <button
          onClick={() => switchTab("match")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "match"
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <div className="text-left">
            <div>Næste kamp</div>
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

      {/* Player view: show latest published lineup */}
      {!isAdmin && (
        <div className="mt-2">
          {publishedLineup ? (
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
                {data?.training && data.training.players.length > 0 ? (
                  <>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">
                      Tilmeldt til {data.training.heading} · {formatDate(data.training.date)}
                    </p>
                    <div className="space-y-1">
                      {data.training.players.map((p) => (
                        <div key={p.id} className="flex items-center gap-2.5 text-sm py-1.5 px-2 rounded-lg">
                          <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                          <span className="text-zinc-200">{p.displayName}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-600 text-xs mt-1">Træneren gemmer holdene her inden træning</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* View mode toggle (only shown after teams generated, admin only) */}
      {isAdmin && result && (
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

          {viewMode === "formation" && (
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

      {/* Formation View */}
      {isAdmin && result && viewMode === "formation" && (
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

      {/* List View (admin only) */}
      {isAdmin && (viewMode === "list" || !result) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Player Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4 text-zinc-400" />
                  Spillere
                </CardTitle>
                <p className="text-xs text-zinc-500">
                  {selected.size + guests.length} valgt
                  {spondPlayers.length > 0 ? (
                    <span className="ml-1.5 text-emerald-400">({spondPlayers.length} tilmeldt via Spond)</span>
                  ) : null}
                </p>
              </CardHeader>
              <CardContent>
                {allPlayersList.length === 0 && guests.length === 0 ? (
                  <p className="text-sm text-zinc-500" data-testid="team-empty-state">Ingen spillere tilgængelige</p>
                ) : (
                  <div className="space-y-1 max-h-[28rem] overflow-y-auto pr-1" data-testid="team-available-players">
                    {/* Spond-accepted players */}
                    {spondPlayers.length > 0 && (
                      <>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400/70 px-2 pt-1 pb-0.5">
                          Tilmeldt
                        </div>
                        {spondPlayers.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-2.5 text-sm cursor-pointer rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(p.id)}
                              onChange={() => togglePlayer(p.id)}
                              className="accent-red-500 rounded"
                            />
                            <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                            <span className="text-zinc-200">{p.displayName}</span>
                            <span className={`ml-auto tabular-nums text-xs font-medium ${winRateColor(p.winRate)}`}>
                              {Math.round(p.winRate * 100)}%
                            </span>
                          </label>
                        ))}
                      </>
                    )}

                    {/* Other players (not signed up on Spond) */}
                    {otherPlayers.length > 0 && (
                      <>
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500 px-2 pt-3 pb-0.5 border-t border-zinc-800/50 mt-2">
                          {spondPlayers.length > 0 ? "Ikke tilmeldt" : "Alle spillere"}
                        </div>
                        {otherPlayers.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-center gap-2.5 text-sm cursor-pointer rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors opacity-70 hover:opacity-100"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(p.id)}
                              onChange={() => togglePlayer(p.id)}
                              className="accent-red-500 rounded"
                            />
                            <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                            <span className="text-zinc-400">{p.displayName}</span>
                            <span className={`ml-auto tabular-nums text-xs font-medium ${winRateColor(p.winRate)}`}>
                              {Math.round(p.winRate * 100)}%
                            </span>
                          </label>
                        ))}
                      </>
                    )}

                    {/* Fallback: if no Spond event, show all players normally */}
                    {spondPlayers.length === 0 && otherPlayers.length === 0 && (data?.allPlayers ?? []).map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2.5 text-sm cursor-pointer rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => togglePlayer(p.id)}
                          className="accent-red-500 rounded"
                        />
                        <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                        <span className="text-zinc-200">{p.displayName}</span>
                        <span className={`ml-auto tabular-nums text-xs font-medium ${winRateColor(p.winRate)}`}>
                          {Math.round(p.winRate * 100)}%
                        </span>
                      </label>
                    ))}

                    {guests.map((g, i) => (
                      <div key={`guest-${i}`} className="flex items-center gap-2.5 text-sm text-zinc-500 px-2 py-1.5">
                        <input type="checkbox" checked disabled className="accent-red-500" />
                        <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-medium text-zinc-500">
                          G
                        </div>
                        <span>Gæst: {g}</span>
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

                {isAdmin && (
                  <Button
                    className="w-full mt-4"
                    onClick={generateTeams}
                    disabled={selected.size + guests.length < 2}
                    data-testid="team-generate-button"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Generer hold
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
                        <div key={p.id} className="flex items-center justify-between text-sm rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors">
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
                              className="h-6 w-6 p-0"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
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
                        <div key={p.id} className="flex items-center justify-between text-sm rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors">
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
                              className="h-6 w-6 p-0"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5" />
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

          {result && (
            <div className="mt-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-sm text-zinc-300 flex-1" data-testid="team-balance">
                Balance: <span className="font-bold text-zinc-50">{result.balance.balancePercent}%</span>
                <span className="text-zinc-500 ml-2">
                  (forskel: {result.balance.difference})
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={copyTeams}
                  data-testid="team-copy-button"
                >
                  {copied ? <Check className="h-4 w-4 mr-1.5" /> : <ClipboardCopy className="h-4 w-4 mr-1.5" />}
                  {copied ? "Kopieret!" : "Kopiér hold"}
                </Button>
                {activeTab === "training" ? (
                  <Button
                    onClick={saveTrainingLineup}
                    disabled={savingLineup || savedLineup}
                    data-testid="team-save-lineup-button"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {savedLineup ? "Gemt!" : savingLineup ? "Gemmer..." : "Gem træningshold"}
                  </Button>
                ) : (
                  <Button
                    onClick={saveMatch}
                    disabled={saving || saved}
                    data-testid="team-save-button"
                  >
                    <Save className="h-4 w-4 mr-1.5" />
                    {saved ? "Gemt!" : saving ? "Gemmer..." : "Gem kamp"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
