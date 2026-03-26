import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { useToast } from "@/components/toast";
import { ArrowLeft, Plus, Banknote, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface Fine {
  id: string;
  player_id: string;
  fine_type_id: string;
  fine_type_name: string;
  player_name: string;
  event_name: string | null;
  event_date: string | null;
  amount: number;
  paid: number;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
}

interface FineType {
  id: string;
  name: string;
  amount: number;
}

export default function FineDetailPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [fines, setFines] = useState<Fine[]>([]);
  const [fineTypes, setFineTypes] = useState<FineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newFineTypeId, setNewFineTypeId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const loadFines = () => {
    api.get<Fine[]>(`/fines?player_id=${playerId}`).then(setFines).catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<Fine[]>(`/fines?player_id=${playerId}`),
      api.get<FineType[]>("/fines/types"),
    ])
      .then(([finesData, types]) => {
        setFines(finesData);
        setFineTypes(types);
      })
      .catch(() => setError("Kunne ikke indlæse bødedata"))
      .finally(() => setLoading(false));
  }, [playerId]);

  const playerName = fines[0]?.player_name || "Spiller";
  const total = fines.reduce((sum, f) => sum + f.amount, 0);
  const paid = fines.reduce((sum, f) => sum + (f.paid ? f.amount : 0), 0);
  const unpaid = total - paid;

  const handlePay = async (fineId: string) => {
    try {
      await api.patch(`/fines/${fineId}/pay`);
      toast("Bøde markeret som betalt", "success");
      loadFines();
    } catch {
      toast("Kunne ikke markere bøde som betalt", "error");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const fineType = fineTypes.find((ft) => ft.id === newFineTypeId);
    const amount = newAmount ? parseInt(newAmount) : fineType?.amount || 0;
    try {
      await api.post("/fines", {
        player_id: playerId,
        fine_type_id: newFineTypeId,
        amount,
        notes: newNotes || undefined,
      });
      toast("Bøde oprettet", "success");
      setShowForm(false);
      setNewFineTypeId("");
      setNewAmount("");
      setNewNotes("");
      loadFines();
    } catch {
      toast("Kunne ikke oprette bøde", "error");
    }
  };

  const handleSelectFineType = (id: string) => {
    setNewFineTypeId(id);
    const ft = fineTypes.find((f) => f.id === id);
    if (ft) setNewAmount(ft.amount.toString());
  };

  if (loading) {
    return (
      <div data-testid="page-fine-detail">
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="py-8"><div className="h-8 bg-zinc-800 rounded animate-pulse" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="page-fine-detail">
        <Card><CardContent className="py-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Prøv igen</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div data-testid="page-fine-detail" className="animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate("/fines")} data-testid="fine-detail-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tilbage
        </Button>
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">{playerName}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Banknote className="h-4 w-4 text-zinc-400" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-zinc-50 mt-1" data-testid="fine-detail-total">{total} kr</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Betalt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-emerald-400 mt-1">{paid} kr</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Ubetalt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-red-400 mt-1">{unpaid} kr</p>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setShowForm(!showForm)} data-testid="fine-add-button">
            {showForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Annuller
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Tilføj bøde
              </>
            )}
          </Button>
        </div>
      )}

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="flex gap-4 items-end flex-wrap" data-testid="fine-create-form">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Type</label>
                <select
                  value={newFineTypeId}
                  onChange={(e) => handleSelectFineType(e.target.value)}
                  className="block w-48 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
                  data-testid="fine-create-type"
                  required
                >
                  <option value="">Vælg type...</option>
                  {fineTypes.map((ft) => (
                    <option key={ft.id} value={ft.id}>{ft.name} ({ft.amount} kr)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Beløb</label>
                <Input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-24"
                  data-testid="fine-create-amount"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Noter</label>
                <Input
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-48"
                  data-testid="fine-create-notes"
                />
              </div>
              <Button type="submit" data-testid="fine-create-submit">Opret</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {fines.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Banknote className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400" data-testid="fine-detail-empty">Ingen bøder for denne spiller</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dato</TableHead>
                    <TableHead>Begivenhed</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Beløb</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Handling</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fines.map((f) => (
                    <TableRow key={f.id} className="transition-colors duration-200" data-testid={`fine-row-${f.id}`}>
                      <TableCell className="tabular-nums text-zinc-300">
                        {f.event_date || f.created_at.split("T")[0]}
                      </TableCell>
                      <TableCell className="text-zinc-300">{f.event_name || f.notes || "—"}</TableCell>
                      <TableCell className="text-zinc-300">{f.fine_type_name}</TableCell>
                      <TableCell className="text-right tabular-nums text-zinc-200">{f.amount} kr</TableCell>
                      <TableCell>
                        {f.paid ? (
                          <Badge variant="success" data-testid="fine-status-paid">
                            Betalt
                          </Badge>
                        ) : (
                          <Badge variant="error" data-testid="fine-status-unpaid">
                            Ubetalt
                          </Badge>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {!f.paid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePay(f.id)}
                              data-testid={`fine-pay-${f.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1.5 text-emerald-400" />
                              Markér betalt
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
