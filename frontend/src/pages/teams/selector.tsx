import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";
import { useToast } from "@/components/toast";
import { Users, Shuffle, Save, UserPlus, ClipboardCopy, Check, ArrowRightLeft } from "lucide-react";

interface AvailablePlayer {
  id: string;
  displayName: string;
  profilePicture?: string | null;
  winRate: number;
  matches: number;
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

export default function TeamSelectorPage() {
  const [available, setAvailable] = useState<AvailablePlayer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [guestName, setGuestName] = useState("");
  const [guests, setGuests] = useState<string[]>([]);
  const [result, setResult] = useState<TeamResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.get<AvailablePlayer[]>("/teams/available")
      .then((data) => {
        setAvailable(data);
        setSelected(new Set(data.map((p) => p.id)));
      })
      .catch(() => setError("Kunne ikke indlæse spillere"))
      .finally(() => setLoading(false));
  }, []);

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
      const data = await api.post<TeamResult>("/teams/generate", { playerIds, algorithm: "greedy" });
      setResult(data);
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
      const data = await api.post<TeamResult>("/teams/swap", {
        team1: result.team1,
        team2: result.team2,
        playerId,
      });
      setResult(data);
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
    return available.find(p => p.id === id)?.profilePicture;
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
          <p className="text-sm text-zinc-500">Generer balancerede hold til træning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-400" />
              Tilgængelige spillere
            </CardTitle>
            <p className="text-xs text-zinc-500">{selected.size + guests.length} valgt</p>
          </CardHeader>
          <CardContent>
            {available.length === 0 && guests.length === 0 ? (
              <p className="text-sm text-zinc-500" data-testid="team-empty-state">Ingen spillere tilgængelige</p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1" data-testid="team-available-players">
                {available.map((p) => (
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

            <Button
              className="w-full mt-4"
              onClick={generateTeams}
              disabled={selected.size + guests.length < 2}
              data-testid="team-generate-button"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Generer hold
            </Button>
          </CardContent>
        </Card>

        {/* Generated Teams */}
        {result && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">1</div>
                  Hold 1
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-400">2</div>
                  Hold 2
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
            <Button
              onClick={saveMatch}
              disabled={saving || saved}
              data-testid="team-save-button"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {saved ? "Gemt!" : saving ? "Gemmer..." : "Gem kamp"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
