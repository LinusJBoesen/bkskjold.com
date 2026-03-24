import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";

interface Player {
  id: string;
  display_name: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  players: number;
  events: number;
}

export default function DashboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get<Player[]>("/players").then(setPlayers).catch(() => {});
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await api.post<SyncResult>("/sync/spond");
      setSyncMessage(result.message);
      // Refresh players
      const updated = await api.get<Player[]>("/players");
      setPlayers(updated);
    } catch {
      setSyncMessage("Synkronisering fejlede");
    }
    setSyncing(false);
  };

  return (
    <div data-testid="page-dashboard">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-black">{da.nav.dashboard}</h1>
        <Button
          onClick={handleSync}
          disabled={syncing}
          data-testid="sync-button"
        >
          {syncing ? "Synkroniserer..." : "Synkronisér Data"}
        </Button>
      </div>

      {syncMessage && (
        <p className="text-sm text-neutral-mid-gray mb-4" data-testid="sync-message">
          {syncMessage}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-mid-gray">
              Spillere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums" data-testid="player-count">
              {players.length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
