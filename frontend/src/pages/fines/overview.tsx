import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { da } from "@/i18n/da";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/toast";
import { Banknote, CheckCircle, AlertTriangle, Users, ChevronRight, ExternalLink, Wallet, X, PlusCircle } from "lucide-react";

interface PlayerSummary {
  id: string;
  display_name: string;
  total: number;
  paid: number;
  unpaid: number;
  fine_count: number;
}

interface BodekasseData {
  totalPaid: number;
  totalUsed: number;
  remaining: number;
}

interface FineType {
  id: string;
  name: string;
  amount: number;
  description: string | null;
}

export default function FinesOverviewPage() {
  const [summaries, setSummaries] = useState<PlayerSummary[]>([]);
  const [bodekasse, setBodekasse] = useState<BodekasseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === "admin";

  // Bulk assign state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [fineTypes, setFineTypes] = useState<FineType[]>([]);
  const [selectedFineType, setSelectedFineType] = useState<FineType | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<PlayerSummary[]>("/fines/summary"),
      api.get<BodekasseData>("/bodekasse"),
    ])
      .then(([summariesData, bodekasseData]) => {
        setSummaries(summariesData);
        setBodekasse(bodekasseData);
      })
      .catch(() => setError("Kunne ikke indlæse bødedata"))
      .finally(() => setLoading(false));
  }, []);

  const openBulkModal = async () => {
    const types = await api.get<FineType[]>("/fines/types");
    setFineTypes(types);
    setSelectedFineType(null);
    setSelectedPlayerIds(new Set());
    setBulkNotes("");
    setBulkOpen(true);
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedPlayerIds.size === summaries.length) {
      setSelectedPlayerIds(new Set());
    } else {
      setSelectedPlayerIds(new Set(summaries.map((s) => s.id)));
    }
  };

  const submitBulk = async () => {
    if (!selectedFineType) return;
    if (selectedPlayerIds.size === 0) {
      toast(da.fines.noPlayersSelected, "error");
      return;
    }
    setBulkSubmitting(true);
    try {
      await api.post("/fines/bulk", {
        fine_type_id: selectedFineType.id,
        amount: selectedFineType.amount,
        player_ids: Array.from(selectedPlayerIds),
        notes: bulkNotes || null,
      });
      toast(da.fines.successBulk(selectedPlayerIds.size), "success");
      setBulkOpen(false);
      // Refresh summaries
      const updated = await api.get<PlayerSummary[]>("/fines/summary");
      setSummaries(updated);
    } catch {
      toast(da.fines.errorBulk, "error");
    } finally {
      setBulkSubmitting(false);
    }
  };

  const totalUnpaid = summaries.reduce((sum, s) => sum + Number(s.unpaid), 0);
  const totalPaid = summaries.reduce((sum, s) => sum + Number(s.paid), 0);

  return (
    <div data-testid="page-fines" className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">{da.nav.fines}</h1>
        {isAdmin && (
          <Button onClick={openBulkModal} data-testid="fines-bulk-assign-btn">
            <PlusCircle className="h-4 w-4 mr-2" />
            {da.fines.bulkAssign}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-stagger">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Total ubetalt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-red-400 mt-1" data-testid="fine-total-unpaid">
              {totalUnpaid} kr
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Total betalt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-emerald-400 mt-1" data-testid="fine-total-paid">
              {totalPaid} kr
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-zinc-400" />
              Spillere med bøder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-zinc-50 mt-1" data-testid="fine-player-count">
              {summaries.filter((s) => s.fine_count > 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <a
        href="https://qr.mobilepay.dk/box/ed7689f5-3718-4168-ad64-bdf9081d0fda/pay-in"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="fines-mobilepay-link"
        className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-[#5A78FF] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5A78FF]/20 transition-colors hover:bg-[#4A68EF]"
      >
        <ExternalLink className="h-4 w-4" />
        {da.fines.payWithMobilePay}
      </a>

      {/* Bødekasse balance */}
      {bodekasse !== null && (
        <Card className="mb-6 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-amber-400" />
              Bødekasse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Indsamlet</p>
                <p className="text-xl font-bold tabular-nums text-emerald-400">{bodekasse.totalPaid} kr</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Brugt</p>
                <p className="text-xl font-bold tabular-nums text-amber-400">{bodekasse.totalUsed} kr</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-0.5">Tilbage i kassen</p>
                <p className={`text-2xl font-bold tabular-nums ${bodekasse.remaining >= 0 ? "text-zinc-50" : "text-red-400"}`}>
                  {bodekasse.remaining} kr
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Prøv igen</Button>
          </CardContent>
        </Card>
      ) : summaries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Banknote className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400" data-testid="fine-empty-state">Ingen bøder endnu</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navn</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Betalt</TableHead>
                    <TableHead className="text-right">Ubetalt</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.map((s) => (
                    <TableRow
                      key={s.id}
                      className="cursor-pointer transition-colors duration-200 hover:bg-white/[0.03]"
                      onClick={() => navigate(`/fines/${s.id}`)}
                      data-testid={`fine-player-row-${s.id}`}
                    >
                      <TableCell className="font-medium text-zinc-200">{s.display_name}</TableCell>
                      <TableCell className="text-right tabular-nums text-zinc-300">{Number(s.total)} kr</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-400">{Number(s.paid)} kr</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {Number(s.unpaid) > 0 ? (
                          <Badge variant="error">{Number(s.unpaid)} kr</Badge>
                        ) : (
                          <Badge variant="success">0 kr</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-zinc-600" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk assign modal */}
      {bulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" data-testid="bulk-assign-modal">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-50">{da.fines.bulkAssignTitle}</h2>
              <button onClick={() => setBulkOpen(false)} className="text-zinc-400 hover:text-zinc-200 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-5 flex-1">
              {/* Step 1: Fine type */}
              <div>
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">{da.fines.chooseFineType}</p>
                <div className="grid grid-cols-2 gap-2">
                  {fineTypes.map((ft) => (
                    <button
                      key={ft.id}
                      onClick={() => setSelectedFineType(ft)}
                      data-testid={`bulk-fine-type-${ft.id}`}
                      className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                        selectedFineType?.id === ft.id
                          ? "border-red-500 bg-red-500/10 text-zinc-50"
                          : "border-zinc-700 hover:border-zinc-500 text-zinc-300"
                      }`}
                    >
                      <p className="text-sm font-medium">{ft.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{ft.amount} kr</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Players */}
              {selectedFineType && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{da.fines.choosePlayers}</p>
                    <button
                      onClick={toggleAll}
                      className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      {selectedPlayerIds.size === summaries.length ? da.fines.deselectAll : da.fines.selectAll}
                    </button>
                  </div>
                  <div className="space-y-1 max-h-52 overflow-y-auto rounded-lg border border-zinc-800 p-1">
                    {summaries.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-zinc-800 transition-colors"
                        data-testid={`bulk-player-${s.id}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlayerIds.has(s.id)}
                          onChange={() => togglePlayer(s.id)}
                          className="accent-red-500 h-4 w-4"
                        />
                        <span className="text-sm text-zinc-200">{s.display_name}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{selectedPlayerIds.size} valgt</p>
                </div>
              )}

              {/* Notes */}
              {selectedFineType && (
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-2">
                    {da.fines.notes}
                  </label>
                  <Input
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    placeholder="f.eks. Træning 28. marts"
                    data-testid="bulk-notes-input"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-zinc-800 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setBulkOpen(false)}>
                {da.common.cancel}
              </Button>
              <Button
                onClick={submitBulk}
                disabled={!selectedFineType || selectedPlayerIds.size === 0 || bulkSubmitting}
                data-testid="bulk-assign-confirm-btn"
              >
                {bulkSubmitting ? "Tildeler..." : da.fines.confirmBulk}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
