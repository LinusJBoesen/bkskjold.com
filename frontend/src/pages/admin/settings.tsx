import { useState, useEffect, useCallback } from "react";
import { da } from "@/i18n/da";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Tab = "config" | "fineTypes" | "data";

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
  fine_missing_match: da.admin.config.fineMissingMatch,
  fine_missing_training: da.admin.config.fineMissingTraining,
  fine_no_response: da.admin.config.fineNoResponse,
  fine_training_loss: da.admin.config.fineTrainingLoss,
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("config");

  const tabs: { id: Tab; label: string }[] = [
    { id: "config", label: da.admin.tabs.config },
    { id: "fineTypes", label: da.admin.tabs.fineTypes },
    { id: "data", label: da.admin.tabs.data },
  ];

  return (
    <div data-testid="page-admin">
      <h1 className="text-2xl font-bold text-brand-black mb-6">{da.admin.title}</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-neutral-light-gray" data-testid="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-testid={`admin-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-brand-red text-brand-red"
                : "border-transparent text-neutral-mid-gray hover:text-brand-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "config" && <ConfigTab />}
      {activeTab === "fineTypes" && <FineTypesTab />}
      {activeTab === "data" && <DataTab />}
    </div>
  );
}

function ConfigTab() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

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
      setTimeout(() => setSaved(null), 2000);
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
            <div key={cfg.key} className="flex items-center gap-4" data-testid={`admin-config-${cfg.key}`}>
              <label className="text-sm font-medium text-brand-black w-64 shrink-0">
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
                <span className="text-sm text-accent-green">{da.admin.config.saved}</span>
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

    if (editingId) {
      await api.put(`/fines/types/${editingId}`, payload);
    } else {
      await api.post("/fines/types", payload);
    }

    resetForm();
    loadFineTypes();
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
    await api.delete(`/fines/types/${id}`);
    loadFineTypes();
  };

  return (
    <Card data-testid="admin-fine-types-section">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{da.admin.fineTypes.title}</CardTitle>
        {!showForm && (
          <Button data-testid="admin-fine-type-add" onClick={() => setShowForm(true)}>
            {da.admin.fineTypes.addNew}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="mb-6 p-4 border border-neutral-light-gray rounded-lg space-y-3" data-testid="admin-fine-type-form">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-neutral-mid-gray">{da.admin.fineTypes.name}</label>
                <Input
                  data-testid="admin-fine-type-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={da.admin.fineTypes.name}
                />
              </div>
              <div className="w-32">
                <label className="text-xs font-medium text-neutral-mid-gray">{da.admin.fineTypes.amount}</label>
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
              <label className="text-xs font-medium text-neutral-mid-gray">{da.admin.fineTypes.description}</label>
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
              <Button data-testid="admin-fine-type-cancel" variant="outline" onClick={resetForm}>
                {da.common.cancel}
              </Button>
            </div>
          </div>
        )}

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
                <TableCell className="font-medium">{ft.name}</TableCell>
                <TableCell className="tabular-nums">{ft.amount} kr</TableCell>
                <TableCell className="text-neutral-mid-gray">{ft.description || "—"}</TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      ft.is_system
                        ? "bg-neutral-light-gray text-neutral-mid-gray"
                        : "bg-blue-50 text-accent-steel-blue"
                    }`}
                    data-testid={`admin-fine-type-badge-${ft.id}`}
                  >
                    {ft.is_system ? da.admin.fineTypes.system : da.admin.fineTypes.custom}
                  </span>
                </TableCell>
                <TableCell>
                  {!ft.is_system && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`admin-fine-type-edit-${ft.id}`}
                        onClick={() => startEdit(ft)}
                      >
                        {da.common.edit}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-brand-red"
                        data-testid={`admin-fine-type-delete-${ft.id}`}
                        onClick={() => handleDelete(ft.id)}
                      >
                        {da.common.delete}
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DataTab() {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
    } catch {
      setStatus({ type: "error", message: da.admin.data.exportError });
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
      } catch {
        setStatus({ type: "error", message: da.admin.data.importError });
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
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border border-neutral-light-gray rounded-lg">
          <div>
            <p className="font-medium text-brand-black">{da.admin.data.exportBtn}</p>
            <p className="text-sm text-neutral-mid-gray">{da.admin.data.exportDesc}</p>
          </div>
          <Button data-testid="admin-export-btn" onClick={handleExport}>
            {da.common.export}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border border-neutral-light-gray rounded-lg">
          <div>
            <p className="font-medium text-brand-black">{da.admin.data.importBtn}</p>
            <p className="text-sm text-neutral-mid-gray">{da.admin.data.importDesc}</p>
          </div>
          <Button data-testid="admin-import-btn" variant="outline" onClick={handleImport} disabled={importing}>
            {importing ? da.common.loading : da.admin.data.importBtn}
          </Button>
        </div>

        {status && (
          <p
            data-testid="admin-data-status"
            className={`text-sm ${status.type === "success" ? "text-accent-green" : "text-brand-red"}`}
          >
            {status.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
