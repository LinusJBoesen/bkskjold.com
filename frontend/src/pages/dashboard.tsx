import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";
import { useToast } from "@/components/toast";
import { RefreshCw, Users, Banknote, CheckCircle, Trophy, TrendingUp, AlertTriangle } from "lucide-react";
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

const COLORS = ["#D42428", "#A1A1AA", "#3B82F6", "#16A34A", "#D97706"];

const darkTooltipStyle = {
  backgroundColor: "#27272A",
  border: "1px solid #3F3F46",
  borderRadius: "8px",
  color: "#FAFAFA",
  fontSize: "12px",
};

function PlayerAvatar({ name, src, size = "sm" }: { name: string; src?: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

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

function StatCard({ icon: Icon, label, value, color, testId }: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
  testId?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/50">
            <Icon className="h-4 w-4 text-zinc-400" />
          </div>
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-3xl font-bold tabular-nums ${color || "text-zinc-50"}`} data-testid={testId}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function Top3Card({ title, items, icon: Icon, valueColor }: {
  title: string;
  items: Top3Item[];
  icon: React.ElementType;
  valueColor: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-zinc-500" />
          <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Ingen data endnu</p>
        ) : (
          <div className="space-y-2">
            {items.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 group">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-medium text-zinc-600 w-4">{i + 1}.</span>
                  <PlayerAvatar name={p.displayName} src={p.profilePicture} />
                  <span className="text-sm text-zinc-200">{p.displayName}</span>
                </div>
                <span className={`text-sm font-bold tabular-nums ${valueColor}`}>{p.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.nav.dashboard}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="py-8"><div className="h-8 bg-zinc-800 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-dashboard">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.nav.dashboard}</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-400 mb-4" data-testid="dashboard-error">{error}</p>
            <Button onClick={() => window.location.reload()}>Prøv igen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="page-dashboard" className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">{da.nav.dashboard}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Overblik over holdet</p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="secondary"
          data-testid="sync-button"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Synkroniserer..." : "Synkronisér Data"}
        </Button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-stagger">
        <StatCard icon={Users} label="Spillere" value={String(data?.totals.players ?? 0)} testId="player-count" />
        <StatCard icon={Banknote} label="Total bøder" value={`${data?.totals.totalFines ?? 0} kr`} color="text-red-400" testId="dashboard-total-fines" />
        <StatCard icon={CheckCircle} label="Betalt" value={`${data?.totals.paidFines ?? 0} kr`} color="text-emerald-400" testId="dashboard-paid-fines" />
      </div>

      {/* Top 3 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" data-testid="dashboard-top3">
          <Top3Card title="Flest sejre" items={data.top3.mostWins} icon={Trophy} valueColor="text-emerald-400" />
          <Top3Card title="Bedste sejrsrate" items={data.top3.bestWinRate} icon={TrendingUp} valueColor="text-emerald-400" />
          <Top3Card title="Højeste bøder" items={data.top3.highestFines} icon={AlertTriangle} valueColor="text-red-400" />
        </div>
      )}

      {/* Charts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-zinc-50">Træningsresultater</CardTitle>
            </CardHeader>
            <CardContent data-testid="dashboard-training-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.trainingChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#A1A1AA" }} stroke="#3F3F46" />
                  <YAxis tick={{ fontSize: 12, fill: "#A1A1AA" }} stroke="#3F3F46" />
                  <Tooltip contentStyle={darkTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: "12px" }} />
                  <Bar dataKey="wins" name="Sejre" fill="#16A34A" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="losses" name="Nederlag" fill="#D42428" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-zinc-50">Bøder per spiller</CardTitle>
            </CardHeader>
            <CardContent data-testid="dashboard-fine-chart">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.fineChart.filter((f) => f.paid + f.unpaid > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#A1A1AA" }} stroke="#3F3F46" />
                  <YAxis tick={{ fontSize: 12, fill: "#A1A1AA" }} stroke="#3F3F46" />
                  <Tooltip contentStyle={darkTooltipStyle} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                  <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: "12px" }} />
                  <Bar dataKey="paid" name="Betalt" fill="#16A34A" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="unpaid" name="Ubetalt" fill="#D42428" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-zinc-50">Bøder efter type</CardTitle>
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
                    stroke="#18181B"
                    strokeWidth={2}
                    label={({ name, total }) => `${name}: ${total} kr`}
                    labelLine={{ stroke: "#3F3F46" }}
                  >
                    {data.fineByType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={darkTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
