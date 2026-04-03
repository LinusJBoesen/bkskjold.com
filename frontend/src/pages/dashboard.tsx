import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";
import { useToast } from "@/components/toast";
import { RefreshCw, Users, Banknote, Trophy, TrendingUp, AlertTriangle, Heart, Activity, Clock, Swords, Target, Star, Wallet } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart,
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
  playerForm: Array<{
    playerId: string;
    displayName: string;
    profilePicture?: string;
    results: string[];
    streak: string;
  }>;
  attendanceTrend: Array<{ date: string; players: number }>;
  recentActivity: Array<{
    type: "fine" | "match";
    id: string;
    description: string;
    date: string;
  }>;
  topContributors: Array<{
    id: string;
    displayName: string;
    profilePicture?: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    cleanSheets: number;
  }>;
  bodekasse: {
    totalCollected: number;
    totalSpent: number;
    remaining: number;
  };
  totals: {
    players: number;
    totalFines: number;
    paidFines: number;
    fans: number;
    matches: number;
    goals: number;
    assists: number;
  };
}

interface SyncResult {
  success: boolean;
  message: string;
  players: number;
  events: number;
}


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

const DONUT_COLORS = ["#D42428", "#16A34A", "#3B82F6", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

function FormBadge({ result }: { result: string }) {
  const colorMap: Record<string, string> = {
    W: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    L: "bg-red-500/20 text-red-400 border-red-500/30",
    D: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };
  const labelMap: Record<string, string> = { W: "S", L: "T", D: "U" };
  return (
    <span className={`inline-flex items-center justify-center h-6 w-6 rounded text-xs font-bold border ${colorMap[result] || colorMap.D}`}>
      {labelMap[result] || result}
    </span>
  );
}

function StreakBadge({ streak }: { streak: string }) {
  if (!streak) return null;
  const count = parseInt(streak);
  const type = streak.slice(-1);
  const labels: Record<string, string> = { W: "sejre", L: "nederlag", D: "uafgjorte" };
  const colors: Record<string, string> = {
    W: "text-emerald-400",
    L: "text-red-400",
    D: "text-zinc-400",
  };
  return (
    <span className={`text-xs font-medium ${colors[type] || colors.D}`}>
      {count} {labels[type] || ""} i træk
    </span>
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
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight">{da.nav.dashboard}</h1>
        <Button
          onClick={handleSync}
          disabled={syncing}
          variant="secondary"
          size="sm"
          data-testid="sync-button"
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Synkroniserer..." : "Synkronisér Data"}
        </Button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 animate-stagger">
        <StatCard icon={Users} label="Spillere" value={String(data?.totals.players ?? 0)} testId="player-count" />
        <StatCard icon={Swords} label="Kampe" value={String(data?.totals.matches ?? 0)} color="text-zinc-50" testId="dashboard-match-count" />
        <StatCard icon={Heart} label="Fans" value={String(data?.totals.fans ?? 0)} color="text-zinc-50" testId="dashboard-fan-count" />
        <StatCard icon={Banknote} label="Total bøder" value={`${data?.totals.totalFines ?? 0} kr`} color="text-red-400" testId="dashboard-total-fines" />
      </div>

      {/* Bødekasse Balance */}
      {data?.bodekasse && (
        <Card className="mb-6" data-testid="dashboard-bodekasse">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/50">
                <Wallet className="h-4 w-4 text-zinc-400" />
              </div>
              <span className="text-sm font-semibold text-zinc-50">{da.dashboard.bodekasse}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-0.5">{da.dashboard.collected}</p>
                <p className="text-lg font-bold text-emerald-400 tabular-nums">{data.bodekasse.totalCollected} kr</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-0.5">{da.dashboard.spent}</p>
                <p className="text-lg font-bold text-red-400 tabular-nums">{data.bodekasse.totalSpent} kr</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-0.5">{da.dashboard.balance}</p>
                <p className={`text-lg font-bold tabular-nums ${data.bodekasse.remaining >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {data.bodekasse.remaining} kr
                </p>
              </div>
            </div>
            {/* Progress bar showing spent vs collected */}
            {data.bodekasse.totalCollected > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>{da.dashboard.spent}</span>
                  <span className="tabular-nums">{Math.round((data.bodekasse.totalSpent / data.bodekasse.totalCollected) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, (data.bodekasse.totalSpent / data.bodekasse.totalCollected) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top 3 */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" data-testid="dashboard-top3">
          <Top3Card title="Flest sejre" items={data.top3.mostWins} icon={Trophy} valueColor="text-emerald-400" />
          <Top3Card title="Bedste sejrsrate" items={data.top3.bestWinRate} icon={TrendingUp} valueColor="text-emerald-400" />
          <Top3Card title="Højeste bøder" items={data.top3.highestFines} icon={AlertTriangle} valueColor="text-red-400" />
        </div>
      )}

      {/* Recent Form */}
      {data && data.playerForm.length > 0 && (
        <Card className="mb-6" data-testid="dashboard-form">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-zinc-50">{da.dashboard.recentForm}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.playerForm.slice(0, 9).map((p) => (
                <div key={p.playerId} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                  <PlayerAvatar name={p.displayName} src={p.profilePicture} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{p.displayName}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex gap-1">
                        {p.results.map((r, i) => (
                          <FormBadge key={i} result={r} />
                        ))}
                      </div>
                    </div>
                    <StreakBadge streak={p.streak} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Contributors */}
      {data && (data.topContributors?.length ?? 0) > 0 && (
        <Card className="mb-6" data-testid="dashboard-top-contributors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-zinc-500" />
              <CardTitle className="text-lg text-zinc-50">{da.dashboard.topContributors}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Stacked bar chart */}
              <div>
                <ResponsiveContainer width="100%" height={Math.max(200, (data.topContributors?.length ?? 0) * 36)}>
                  <BarChart
                    data={data.topContributors}
                    layout="vertical"
                    margin={{ left: 0, right: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#A1A1AA" }} stroke="#3F3F46" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="displayName"
                      tick={{ fontSize: 11, fill: "#A1A1AA" }}
                      stroke="#3F3F46"
                      width={80}
                    />
                    <Tooltip
                      contentStyle={darkTooltipStyle}
                      cursor={{ fill: "rgba(255,255,255,0.02)" }}
                      formatter={(value: number, name: string) => [
                        value,
                        name === "goals" ? da.dashboard.goals : da.dashboard.assists,
                      ]}
                    />
                    <Legend
                      wrapperStyle={{ color: "#A1A1AA", fontSize: "12px" }}
                      formatter={(value: string) => (
                        <span className="text-zinc-300 text-xs">
                          {value === "goals" ? da.dashboard.goals : da.dashboard.assists}
                        </span>
                      )}
                    />
                    <Bar dataKey="goals" stackId="a" fill="#16A34A" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="assists" stackId="a" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Contributor cards */}
              <div className="space-y-1.5">
                {data.topContributors.slice(0, 5).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                    <span className="text-xs font-bold text-zinc-500 w-5 text-center tabular-nums">{i + 1}</span>
                    <PlayerAvatar name={p.displayName} src={p.profilePicture} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{p.displayName}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs tabular-nums">
                      {p.goals > 0 && (
                        <span className="text-emerald-400" title={da.dashboard.goals}>
                          ⚽ {p.goals}
                        </span>
                      )}
                      {p.assists > 0 && (
                        <span className="text-blue-400" title={da.dashboard.assists}>
                          🅰️ {p.assists}
                        </span>
                      )}
                      {p.cleanSheets > 0 && (
                        <span className="text-zinc-400" title="Clean sheets">
                          🧤 {p.cleanSheets}
                        </span>
                      )}
                      {p.yellowCards > 0 && (
                        <span className="text-yellow-400" title={da.dashboard.yellowCards}>
                          🟨 {p.yellowCards}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(data.totals.goals > 0 || data.totals.assists > 0) && (
                  <div className="flex items-center gap-4 pt-2 mt-1 border-t border-zinc-800/50">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Star className="h-3 w-3" />
                      <span>{da.dashboard.totalGoals}: <span className="text-emerald-400 font-medium tabular-nums">{data.totals.goals}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <span>{da.dashboard.totalAssists}: <span className="text-blue-400 font-medium tabular-nums">{data.totals.assists}</span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-zinc-50">{da.dashboard.trainingResults}</CardTitle>
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
              <CardTitle className="text-lg text-zinc-50">{da.dashboard.finesPerPlayer}</CardTitle>
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
        </div>
      )}

      {/* Fine Breakdown Donut */}
      {data && data.fineByType.length > 0 && (
        <Card className="mb-6" data-testid="dashboard-fine-by-type">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-50">{da.dashboard.fineBreakdown}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.fineByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="total"
                  nameKey="name"
                  stroke="none"
                >
                  {data.fineByType.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={darkTooltipStyle}
                  formatter={(value: number) => [`${value} kr`, ""]}
                />
                <Legend
                  wrapperStyle={{ color: "#A1A1AA", fontSize: "12px" }}
                  formatter={(value: string) => <span className="text-zinc-300 text-xs">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Attendance Trend + Recent Activity */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Attendance trend - area chart */}
          {(data.attendanceTrend?.length ?? 0) > 1 && (
            <Card data-testid="dashboard-attendance-trend">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-zinc-500" />
                  <CardTitle className="text-lg text-zinc-50">{da.dashboard.attendanceTrend}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.attendanceTrend}>
                    <defs>
                      <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D42428" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#D42428" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#A1A1AA" }}
                      stroke="#3F3F46"
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#A1A1AA" }} stroke="#3F3F46" allowDecimals={false} />
                    <Tooltip
                      contentStyle={darkTooltipStyle}
                      labelFormatter={(v) => {
                        const d = new Date(v);
                        return d.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
                      }}
                      formatter={(value: number) => [`${value}`, da.dashboard.players]}
                    />
                    <Area
                      type="monotone"
                      dataKey="players"
                      stroke="#D42428"
                      strokeWidth={2}
                      fill="url(#attendanceGradient)"
                      dot={{ fill: "#D42428", strokeWidth: 0, r: 3 }}
                      activeDot={{ fill: "#D42428", strokeWidth: 2, stroke: "#fff", r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Recent activity feed */}
          {(data.recentActivity?.length ?? 0) > 0 && (
            <Card data-testid="dashboard-recent-activity">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  <CardTitle className="text-lg text-zinc-50">{da.dashboard.recentActivity}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {data.recentActivity.map((event) => (
                    <div
                      key={`${event.type}-${event.id}`}
                      className="flex items-start gap-3 py-2.5 border-b border-zinc-800/50 last:border-0"
                    >
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                        event.type === "fine"
                          ? "bg-red-500/10 border border-red-500/20"
                          : "bg-emerald-500/10 border border-emerald-500/20"
                      }`}>
                        {event.type === "fine" ? (
                          <Banknote className="h-3.5 w-3.5 text-red-400" />
                        ) : (
                          <Swords className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 leading-snug">{event.description}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {new Date(event.date).toLocaleDateString("da-DK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
