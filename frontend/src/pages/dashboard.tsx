import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";
import { useToast } from "@/components/toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

interface Top3Item {
  displayName: string;
  profilePicture?: string;
  value: number;
  label: string;
}

interface DashboardData {
  top3: {
    mostWins: Top3Item[];
    bestWinRate: Top3Item[];
    highestFines: Top3Item[];
  };
  trainingChart: Array<{ name: string; wins: number; losses: number; winRate: number }>;
  fineChart: Array<{ name: string; paid: number; unpaid: number }>;
  fineByType: Array<{ name: string; total: number }>;
  totals: {
    players: number;
    totalFines: number;
    paidFines: number;
  };
}

interface SyncResult {
  success: boolean;
  message: string;
  players: number;
  events: number;
}

const COLORS = ["#D42428", "#1A1A1A", "#4A6FA5", "#16A34A", "#D97706"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.get<DashboardData>("/stats/dashboard")
      .then(setData)
      .catch(() => setError("Kunne ikke indlæse dashboard-data"))
      .finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await api.post<SyncResult>("/sync/spond");
      toast(result.message, "success");
      const updated = await api.get<DashboardData>("/stats/dashboard");
      setData(updated);
    } catch {
      toast("Synkronisering fejlede", "error");
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div data-testid="page-dashboard">
        <h1 className="text-2xl font-bold text-brand-black mb-6">{da.nav.dashboard}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="py-8"><div className="h-8 bg-neutral-light-gray rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-dashboard">
        <h1 className="text-2xl font-bold text-brand-black mb-6">{da.nav.dashboard}</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-brand-red mb-4" data-testid="dashboard-error">{error}</p>
            <Button onClick={() => window.location.reload()}>Prøv igen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="page-dashboard">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-brand-black">{da.nav.dashboard}</h1>
        <Button onClick={handleSync} disabled={syncing} data-testid="sync-button">
          {syncing ? "Synkroniserer..." : "Synkronisér Data"}
        </Button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-mid-gray">Spillere</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums" data-testid="player-count">
              {data?.totals.players ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-mid-gray">Total bøder</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-brand-red" data-testid="dashboard-total-fines">
              {data?.totals.totalFines ?? 0} kr
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-mid-gray">Betalt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-accent-green" data-testid="dashboard-paid-fines">
              {data?.totals.paidFines ?? 0} kr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" data-testid="dashboard-top3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-mid-gray">Flest sejre</CardTitle>
            </CardHeader>
            <CardContent>
              {data.top3.mostWins.length === 0 ? (
                <p className="text-sm text-neutral-mid-gray">Ingen data endnu</p>
              ) : (
                data.top3.mostWins.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm">{p.displayName}</span>
                    <span className="text-sm font-bold tabular-nums text-accent-green">{p.label}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-mid-gray">Bedste sejrsrate</CardTitle>
            </CardHeader>
            <CardContent>
              {data.top3.bestWinRate.length === 0 ? (
                <p className="text-sm text-neutral-mid-gray">Ingen data endnu</p>
              ) : (
                data.top3.bestWinRate.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm">{p.displayName}</span>
                    <span className="text-sm font-bold tabular-nums text-accent-green">{p.label}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-neutral-mid-gray">Højeste bøder</CardTitle>
            </CardHeader>
            <CardContent>
              {data.top3.highestFines.length === 0 ? (
                <p className="text-sm text-neutral-mid-gray">Ingen data endnu</p>
              ) : (
                data.top3.highestFines.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm">{p.displayName}</span>
                    <span className="text-sm font-bold tabular-nums text-brand-red">{p.label}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Træningsresultater</CardTitle>
            </CardHeader>
            <CardContent data-testid="dashboard-training-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.trainingChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="wins" name="Sejre" fill="#16A34A" stackId="a" />
                  <Bar dataKey="losses" name="Nederlag" fill="#D42428" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bøder per spiller</CardTitle>
            </CardHeader>
            <CardContent data-testid="dashboard-fine-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.fineChart.filter((f) => f.paid + f.unpaid > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="paid" name="Betalt" fill="#16A34A" stackId="a" />
                  <Bar dataKey="unpaid" name="Ubetalt" fill="#D42428" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bøder efter type</CardTitle>
            </CardHeader>
            <CardContent data-testid="dashboard-fine-type-chart">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.fineByType}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, total }) => `${name}: ${total} kr`}
                  >
                    {data.fineByType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
