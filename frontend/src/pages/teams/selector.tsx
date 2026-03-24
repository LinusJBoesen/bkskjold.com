import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";
import { useToast } from "@/components/toast";

interface AvailablePlayer {
  id: string;
  displayName: string;
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

  const winRateColor = (rate: number) => {
    if (rate > 0.5) return "text-accent-green";
    if (rate < 0.5) return "text-brand-red";
    return "text-accent-steel-blue";
  };

  if (loading) {
    return (
      <div data-testid="page-teams">
        <h1 className="text-2xl font-bold text-brand-black mb-6">{da.nav.teams}</h1>
        <Card><CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-neutral-light-gray rounded animate-pulse" />
            ))}
          </div>
        </CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-teams">
        <h1 className="text-2xl font-bold text-brand-black mb-6">{da.nav.teams}</h1>
        <Card><CardContent className="py-8 text-center">
          <p className="text-brand-red mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Prøv igen</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div data-testid="page-teams">
      <h1 className="text-2xl font-bold text-brand-black mb-6">{da.nav.teams}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tilgængelige spillere</CardTitle>
          </CardHeader>
          <CardContent>
            {available.length === 0 && guests.length === 0 ? (
              <p className="text-sm text-neutral-mid-gray" data-testid="team-empty-state">Ingen spillere tilgængelige</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto" data-testid="team-available-players">
                {available.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => togglePlayer(p.id)}
                      className="accent-brand-red"
                    />
                    <span>{p.displayName}</span>
                    <span className={`ml-auto tabular-nums text-xs ${winRateColor(p.winRate)}`}>
                      {Math.round(p.winRate * 100)}%
                    </span>
                  </label>
                ))}
                {guests.map((g, i) => (
                  <div key={`guest-${i}`} className="flex items-center gap-2 text-sm text-neutral-mid-gray">
                    <input type="checkbox" checked disabled className="accent-brand-red" />
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
                Tilføj gæst
              </Button>
            </div>

            <Button
              className="w-full mt-4"
              onClick={generateTeams}
              disabled={selected.size + guests.length < 2}
              data-testid="team-generate-button"
            >
              Generer hold
            </Button>
          </CardContent>
        </Card>

        {/* Generated Teams */}
        {result && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hold 1</CardTitle>
                <p className="text-xs text-neutral-mid-gray">
                  Styrke: {result.balance.team1Strength}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2" data-testid="team-1-players">
                  {result.team1.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span>{p.displayName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`tabular-nums text-xs ${winRateColor(p.winRate)}`}>
                          {Math.round(p.winRate * 100)}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => swapPlayer(p.id)}
                          data-testid={`team-swap-${p.id}`}
                          className="h-6 w-6 p-0"
                        >
                          &#x1F504;
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hold 2</CardTitle>
                <p className="text-xs text-neutral-mid-gray">
                  Styrke: {result.balance.team2Strength}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2" data-testid="team-2-players">
                  {result.team2.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span>{p.displayName}</span>
                      <div className="flex items-center gap-2">
                        <span className={`tabular-nums text-xs ${winRateColor(p.winRate)}`}>
                          {Math.round(p.winRate * 100)}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => swapPlayer(p.id)}
                          data-testid={`team-swap-${p.id}`}
                          className="h-6 w-6 p-0"
                        >
                          &#x1F504;
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
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-sm" data-testid="team-balance">
            Balance: <span className="font-bold">{result.balance.balancePercent}%</span>
            <span className="text-neutral-mid-gray ml-2">
              (forskel: {result.balance.difference})
            </span>
          </div>
          <Button
            onClick={saveMatch}
            disabled={saving || saved}
            data-testid="team-save-button"
          >
            {saved ? "Gemt!" : saving ? "Gemmer..." : "Gem kamp"}
          </Button>
        </div>
      )}
    </div>
  );
}
