import { useState, useEffect, useCallback } from "react";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, FileText, Database, Download, Upload, Plus, Pencil, Trash2, Check, UserCog, Users as UsersIcon, Heart, Wallet } from "lucide-react";

type Tab = "config" | "fineTypes" | "positions" | "data" | "users" | "fanSignups" | "bodekasse";

interface ConfigItem {
  key: string;
  value: string;
  updated_at: string;
}

interface FineType {
  id: string;
  name: string;
  amount: number;
  description: string | null;
  is_system: number;
  created_at: string;
}

const CONFIG_LABELS: Record<string, string> = {
  spond_group_id: da.admin.config.spondGroupId,
  late_response_hours: da.admin.config.lateResponseHours,
};

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  config: <Settings className="w-4 h-4" />,
  fineTypes: <FileText className="w-4 h-4" />,
  positions: <UserCog className="w-4 h-4" />,
  data: <Database className="w-4 h-4" />,
  users: <UsersIcon className="w-4 h-4" />,
  fanSignups: <Heart className="w-4 h-4" />,
  bodekasse: <Wallet className="w-4 h-4" />,
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("config");

  const tabs: { id: Tab; label: string }[] = [
    { id: "config", label: da.admin.tabs.config },
    { id: "fineTypes", label: da.admin.tabs.fineTypes },
    { id: "positions", label: "Spillerpositioner" },
    { id: "data", label: da.admin.tabs.data },
    { id: "users", label: da.admin.tabs.users },
    { id: "fanSignups", label: "Fan-tilmeldinger" },
    { id: "bodekasse", label: "Bødekasse" },
  ];

  return (
    <div data-testid="page-admin" className="animate-fade-in-up">
      <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.admin.title}</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-zinc-800" data-testid="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-testid={`admin-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-red-500 text-red-400"
                : "border-transparent text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {TAB_ICONS[tab.id]}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "config" && <ConfigTab />}
      {activeTab === "fineTypes" && <FineTypesTab />}
      {activeTab === "positions" && <PlayerPositionsTab />}
      {activeTab === "data" && <DataTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "fanSignups" && <FanSignupsTab />}
      {activeTab === "bodekasse" && <BodekasseTab />}
    </div>
  );
}

function ConfigTab() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    api.get<ConfigItem[]>("/admin/config").then((data) => {
      setConfigs(data);
      const values: Record<string, string> = {};
      for (const cfg of data) {
        values[cfg.key] = cfg.value;
      }
      setEditValues(values);
    });
  }, []);

  const saveConfig = async (key: string) => {
    setSaving(key);
    try {
      await api.put(`/admin/config/${key}`, { value: editValues[key] });
      setSaved(key);
      toast(da.admin.config.saved, "success");
      setTimeout(() => setSaved(null), 2000);
    } catch {
      toast("Kunne ikke gemme konfiguration", "error");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card data-testid="admin-config-section">
      <CardHeader>
        <CardTitle>{da.admin.config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {configs.map((cfg) => (
            <div key={cfg.key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4" data-testid={`admin-config-${cfg.key}`}>
              <label className="text-sm font-medium text-zinc-300 sm:w-64 sm:shrink-0">
                {CONFIG_LABELS[cfg.key] || cfg.key}
              </label>
              <Input
                data-testid={`admin-config-input-${cfg.key}`}
                value={editValues[cfg.key] || ""}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, [cfg.key]: e.target.value }))
                }
                className="max-w-xs"
              />
              <Button
                data-testid={`admin-config-save-${cfg.key}`}
                onClick={() => saveConfig(cfg.key)}
                disabled={saving === cfg.key}
                size="sm"
              >
                {saving === cfg.key ? da.common.loading : da.common.save}
              </Button>
              {saved === cfg.key && (
                <span className="text-sm text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {da.admin.config.saved}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FineTypesTab() {
  const [fineTypes, setFineTypes] = useState<FineType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const { toast } = useToast();

  const loadFineTypes = useCallback(() => {
    api.get<FineType[]>("/fines/types").then(setFineTypes);
  }, []);

  useEffect(() => {
    loadFineTypes();
  }, [loadFineTypes]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormAmount("");
    setFormDescription("");
  };

  const handleSubmit = async () => {
    const payload = {
      name: formName,
      amount: parseInt(formAmount, 10),
      description: formDescription || null,
    };

    try {
      if (editingId) {
        await api.put(`/fines/types/${editingId}`, payload);
        toast("Bødetype opdateret", "success");
      } else {
        await api.post("/fines/types", payload);
        toast("Bødetype oprettet", "success");
      }
      resetForm();
      loadFineTypes();
    } catch {
      toast("Kunne ikke gemme bødetype", "error");
    }
  };

  const startEdit = (ft: FineType) => {
    setEditingId(ft.id);
    setFormName(ft.name);
    setFormAmount(String(ft.amount));
    setFormDescription(ft.description || "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(da.admin.fineTypes.confirmDelete)) return;
    try {
      await api.delete(`/fines/types/${id}`);
      toast("Bødetype slettet", "success");
      loadFineTypes();
    } catch {
      toast("Kunne ikke slette bødetype", "error");
    }
  };

  return (
    <Card data-testid="admin-fine-types-section">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{da.admin.fineTypes.title}</CardTitle>
        {!showForm && (
          <Button data-testid="admin-fine-type-add" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {da.admin.fineTypes.addNew}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-6 p-4 border border-zinc-800 rounded-xl bg-zinc-900/50 space-y-3" data-testid="admin-fine-type-form">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{da.admin.fineTypes.name}</label>
                <Input
                  data-testid="admin-fine-type-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={da.admin.fineTypes.name}
                />
              </div>
              <div className="w-32">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{da.admin.fineTypes.amount}</label>
                <Input
                  data-testid="admin-fine-type-amount"
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{da.admin.fineTypes.description}</label>
              <Input
                data-testid="admin-fine-type-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={da.admin.fineTypes.description}
              />
            </div>
            <div className="flex gap-2">
              <Button data-testid="admin-fine-type-submit" onClick={handleSubmit} disabled={!formName || !formAmount}>
                {editingId ? da.common.save : da.common.create}
              </Button>
              <Button data-testid="admin-fine-type-cancel" variant="secondary" onClick={resetForm}>
                {da.common.cancel}
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{da.admin.fineTypes.name}</TableHead>
              <TableHead>{da.admin.fineTypes.amount}</TableHead>
              <TableHead>{da.admin.fineTypes.description}</TableHead>
              <TableHead>Type</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fineTypes.map((ft) => (
              <TableRow key={ft.id} data-testid={`admin-fine-type-row-${ft.id}`}>
                <TableCell className="font-medium text-zinc-200">{ft.name}</TableCell>
                <TableCell className="tabular-nums text-zinc-300">{ft.amount} kr</TableCell>
                <TableCell className="text-zinc-500">{ft.description || "\u2014"}</TableCell>
                <TableCell>
                  <Badge
                    variant={ft.is_system ? "default" : "info"}
                    data-testid={`admin-fine-type-badge-${ft.id}`}
                  >
                    {ft.is_system ? da.admin.fineTypes.system : da.admin.fineTypes.custom}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`admin-fine-type-edit-${ft.id}`}
                      onClick={() => startEdit(ft)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      {da.common.edit}
                    </Button>
                    {!ft.is_system && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                        data-testid={`admin-fine-type-delete-${ft.id}`}
                        onClick={() => handleDelete(ft.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        {da.common.delete}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}

type Position = "keeper" | "defender" | "wing" | "midfield" | "attacker";

const ALL_POSITIONS: { id: Position; label: string; abbr: string }[] = [
  { id: "keeper", label: "Målmand", abbr: "K" },
  { id: "defender", label: "Forsvar", abbr: "F" },
  { id: "wing", label: "Kant", abbr: "Ka" },
  { id: "midfield", label: "Central", abbr: "C" },
  { id: "attacker", label: "Angriber", abbr: "A" },
];

interface PlayerWithPositions {
  id: string;
  displayName: string;
  profilePicture: string | null;
  positions: Position[];
}

function PlayerPositionsTab() {
  const [players, setPlayers] = useState<PlayerWithPositions[]>([]);
  const [modified, setModified] = useState<Record<string, Position[]>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    api.get<PlayerWithPositions[]>("/formations/players/positions")
      .then((data) => {
        if (Array.isArray(data)) {
          setPlayers(data);
        }
      })
      .catch((err) => {
        setError("Kunne ikke hente spillere");
        console.error("Failed to load player positions:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const togglePosition = (playerId: string, position: Position) => {
    setModified((prev) => {
      const current = prev[playerId] ?? players.find((p) => p.id === playerId)?.positions ?? [];
      const next = current.includes(position)
        ? current.filter((p) => p !== position)
        : [...current, position];
      return { ...prev, [playerId]: next };
    });
  };

  const getPositions = (playerId: string): Position[] => {
    return modified[playerId] ?? players.find((p) => p.id === playerId)?.positions ?? [];
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(modified);
      for (const [playerId, positions] of entries) {
        await api.put(`/formations/players/${playerId}/positions`, { positions });
      }
      // Update local state
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          positions: modified[p.id] ?? p.positions,
        }))
      );
      setModified({});
      toast("Positioner gemt", "success");
    } catch {
      toast("Kunne ikke gemme positioner", "error");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = Object.keys(modified).length > 0;

  return (
    <Card data-testid="admin-positions-section">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Spillerpositioner</CardTitle>
        {hasChanges && (
          <Button
            data-testid="admin-positions-save"
            onClick={handleSaveAll}
            disabled={saving}
          >
            <Check className="w-4 h-4 mr-1" />
            {saving ? da.common.loading : `Gem ændringer (${Object.keys(modified).length})`}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading && <p className="text-zinc-400 py-4">{da.common.loading}</p>}
        {error && <p className="text-red-400 py-4">{error}</p>}
        {!loading && !error && players.length === 0 && (
          <p className="text-zinc-500 py-4">Ingen spillere fundet. Synkroniser fra Spond for at hente spillere.</p>
        )}
        {!loading && players.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Spiller</TableHead>
                {ALL_POSITIONS.map((pos) => (
                  <TableHead key={pos.id} className="text-center w-20">
                    <div className="text-xs">{pos.label}</div>
                    <div className="text-[10px] text-zinc-500">{pos.abbr}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id} data-testid={`admin-position-row-${player.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                        {player.profilePicture ? (
                          <img src={player.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-medium text-zinc-400">
                            {player.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-zinc-200 truncate">{player.displayName}</span>
                    </div>
                  </TableCell>
                  {ALL_POSITIONS.map((pos) => {
                    const active = getPositions(player.id).includes(pos.id);
                    const isModified = modified[player.id] !== undefined;
                    return (
                      <TableCell key={pos.id} className="text-center">
                        <button
                          data-testid={`admin-position-${player.id}-${pos.id}`}
                          onClick={() => togglePosition(player.id, pos.id)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            active
                              ? "bg-red-500/20 border-red-500/50 text-red-400"
                              : "bg-zinc-900/50 border-zinc-700/50 text-zinc-600 hover:border-zinc-500"
                          } ${isModified ? "ring-1 ring-amber-500/30" : ""}`}
                        >
                          {active ? "✓" : ""}
                        </button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>
    </Card>
  );
}

function DataTab() {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      const data = await api.get<object>("/admin/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skjold-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Data eksporteret", "success");
    } catch {
      setStatus({ type: "error", message: da.admin.data.exportError });
      toast(da.admin.data.exportError, "error");
    }
  };

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImporting(true);
      setStatus(null);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await api.post("/admin/import", data);
        setStatus({ type: "success", message: da.admin.data.importSuccess });
        toast(da.admin.data.importSuccess, "success");
      } catch {
        setStatus({ type: "error", message: da.admin.data.importError });
        toast(da.admin.data.importError, "error");
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <Card data-testid="admin-data-section">
      <CardHeader>
        <CardTitle>{da.admin.data.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
          <div>
            <p className="font-medium text-zinc-200 flex items-center gap-2">
              <Download className="w-4 h-4 text-zinc-400" />
              {da.admin.data.exportBtn}
            </p>
            <p className="text-sm text-zinc-500 ml-6">{da.admin.data.exportDesc}</p>
          </div>
          <Button data-testid="admin-export-btn" onClick={handleExport}>
            {da.common.export}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
          <div>
            <p className="font-medium text-zinc-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-zinc-400" />
              {da.admin.data.importBtn}
            </p>
            <p className="text-sm text-zinc-500 ml-6">{da.admin.data.importDesc}</p>
          </div>
          <Button data-testid="admin-import-btn" variant="secondary" onClick={handleImport} disabled={importing}>
            {importing ? da.common.loading : da.admin.data.importBtn}
          </Button>
        </div>

        {status && (
          <p
            data-testid="admin-data-status"
            className={`text-sm ${status.type === "success" ? "text-emerald-400" : "text-red-400"}`}
          >
            {status.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  approved: number;
  player_name: string | null;
  created_at: string;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  spiller: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fan: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

function UsersTab() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadUsers = useCallback(() => {
    api.get<UserRecord[]>("/admin/users")
      .then(setUsers)
      .catch(() => toast("Kunne ikke hente brugere", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const pendingUsers = users.filter((u) => !u.approved);
  const allUsers = users;

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/approve`);
      toast("Bruger godkendt", "success");
      loadUsers();
    } catch {
      toast("Kunne ikke godkende bruger", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på, at du vil slette denne bruger?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast(da.admin.users.deleted, "success");
      loadUsers();
    } catch {
      toast("Kunne ikke slette bruger", "error");
    }
  };

  if (loading) {
    return (
      <Card data-testid="admin-users-section">
        <CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-users-section">
      {/* Pending approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-amber-400" />
            {da.admin.users.pending}
            {pendingUsers.length > 0 && (
              <Badge variant="warning" data-testid="admin-users-pending-count">
                {pendingUsers.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <p className="text-sm text-zinc-500" data-testid="admin-users-no-pending">
              {da.admin.users.noPending}
            </p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5"
                  data-testid={`admin-user-pending-${u.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200">{u.name}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${ROLE_BADGE_COLORS[u.role] || ROLE_BADGE_COLORS.fan}`}>
                        {(da.roles as Record<string, string>)[u.role] || u.role}
                      </span>
                      {u.player_name && (
                        <span className="text-xs text-zinc-500">Spond: {u.player_name}</span>
                      )}
                      <span className="text-xs text-zinc-600">
                        {new Date(u.created_at).toLocaleDateString("da-DK")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(u.id)}
                      data-testid={`admin-user-approve-${u.id}`}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      {da.admin.users.approve}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(u.id)}
                      data-testid={`admin-user-reject-${u.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      {da.admin.users.reject}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All users */}
      <Card>
        <CardHeader>
          <CardTitle>{da.admin.users.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{da.admin.users.name}</TableHead>
                  <TableHead>{da.admin.users.email}</TableHead>
                  <TableHead>{da.admin.users.role}</TableHead>
                  <TableHead>{da.admin.users.status}</TableHead>
                  <TableHead>{da.admin.users.created}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((u) => (
                  <TableRow key={u.id} data-testid={`admin-user-row-${u.id}`}>
                    <TableCell className="font-medium text-zinc-200">{u.name}</TableCell>
                    <TableCell className="text-zinc-400">{u.email}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${ROLE_BADGE_COLORS[u.role] || ROLE_BADGE_COLORS.fan}`}>
                        {(da.roles as Record<string, string>)[u.role] || u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.approved ? (
                        <Badge variant="success">{da.admin.users.approved}</Badge>
                      ) : (
                        <Badge variant="warning">{da.common.pending}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-500 tabular-nums">
                      {new Date(u.created_at).toLocaleDateString("da-DK")}
                    </TableCell>
                    <TableCell>
                      {u.role !== "admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(u.id)}
                          data-testid={`admin-user-delete-${u.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface FanSignup {
  id: string;
  name: string;
  email: string | null;
  position: string | null;
  comment: string | null;
  love_level: number;
  created_at: string;
}

const POSITION_LABELS: Record<string, string> = {
  keeper: "Målmand",
  defender: "Forsvar",
  wing: "Kant",
  midfield: "Central",
  attacker: "Angriber",
};

interface BodekasseExpense {
  id: string;
  description: string;
  amount: number;
  created_at: string;
}

interface BodekasseData {
  totalPaid: number;
  totalUsed: number;
  remaining: number;
  expenses: BodekasseExpense[];
}

function BodekasseTab() {
  const [data, setData] = useState<BodekasseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    api.get<BodekasseData>("/bodekasse")
      .then(setData)
      .catch(() => toast("Kunne ikke hente bødekasse data", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    try {
      await api.post("/bodekasse", { description: desc, amount: parseInt(amount) });
      toast("Udgift tilføjet", "success");
      setDesc("");
      setAmount("");
      load();
    } catch {
      toast("Kunne ikke tilføje udgift", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på, at du vil slette denne udgift?")) return;
    try {
      await api.delete(`/bodekasse/${id}`);
      toast("Udgift slettet", "success");
      load();
    } catch {
      toast("Kunne ikke slette udgift", "error");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Indsamlet (betalt)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-emerald-400">{data?.totalPaid ?? 0} kr</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Brugt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-amber-400">{data?.totalUsed ?? 0} kr</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tilbage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold tabular-nums ${(data?.remaining ?? 0) >= 0 ? "text-zinc-50" : "text-red-400"}`}>
              {data?.remaining ?? 0} kr
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add expense */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            Registrér udgift
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Beskrivelse</label>
              <Input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="w-56"
                placeholder="F.eks. Øl til træning"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Beløb (kr)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-28"
                placeholder="0"
                required
              />
            </div>
            <Button type="submit">
              <Plus className="w-4 h-4 mr-1.5" />
              Tilføj
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Expenses list */}
      <Card>
        <CardHeader>
          <CardTitle>Udgifter</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!data?.expenses.length ? (
            <p className="text-zinc-500 text-sm px-6 py-4">Ingen udgifter registreret endnu</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dato</TableHead>
                  <TableHead>Beskrivelse</TableHead>
                  <TableHead className="text-right">Beløb</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="tabular-nums text-zinc-400 text-sm">
                      {new Date(e.created_at).toLocaleDateString("da-DK")}
                    </TableCell>
                    <TableCell className="text-zinc-200">{e.description}</TableCell>
                    <TableCell className="text-right tabular-nums text-amber-400 font-medium">{e.amount} kr</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FanSignupsTab() {
  const [signups, setSignups] = useState<FanSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSignups = useCallback(() => {
    setLoading(true);
    api.get<FanSignup[]>("/fan-signup")
      .then(setSignups)
      .catch(() => toast("Kunne ikke hente tilmeldinger", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    loadSignups();
  }, [loadSignups]);

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på, at du vil slette denne tilmelding?")) return;
    try {
      await api.delete(`/fan-signup/${id}`);
      toast("Tilmelding slettet", "success");
      loadSignups();
    } catch {
      toast("Kunne ikke slette tilmelding", "error");
    }
  };

  if (loading) {
    return (
      <Card data-testid="admin-fan-signups-section">
        <CardContent className="py-8">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="admin-fan-signups-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-400" />
          Fan-tilmeldinger
          {signups.length > 0 && (
            <Badge variant="info">{signups.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {signups.length === 0 ? (
          <p className="text-zinc-500 text-sm" data-testid="admin-fan-signups-empty">Ingen tilmeldinger endnu</p>
        ) : (
          <div className="space-y-3">
            {signups.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/30"
                data-testid={`admin-fan-signup-${s.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-zinc-200">{s.name}</p>
                      {s.position && (
                        <Badge variant="default">{POSITION_LABELS[s.position] || s.position}</Badge>
                      )}
                    </div>
                    {s.email && <p className="text-xs text-zinc-500">{s.email}</p>}
                    {s.comment && <p className="text-sm text-zinc-400 mt-1">{s.comment}</p>}
                    <p className="text-xs text-zinc-600 mt-2">
                      Kærlighed: {s.love_level}/10 · {new Date(s.created_at).toLocaleDateString("da-DK", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                    data-testid={`admin-fan-signup-delete-${s.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
