import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [fines, setFines] = useState<Fine[]>([]);
  const [fineTypes, setFineTypes] = useState<FineType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newFineTypeId, setNewFineTypeId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const loadFines = () => {
    api.get<Fine[]>(`/fines?player_id=${playerId}`).then(setFines).catch(() => {});
  };

  useEffect(() => {
    loadFines();
    api.get<FineType[]>("/fines/types").then(setFineTypes).catch(() => {});
  }, [playerId]);

  const playerName = fines[0]?.player_name || "Spiller";
  const total = fines.reduce((sum, f) => sum + f.amount, 0);
  const paid = fines.reduce((sum, f) => sum + (f.paid ? f.amount : 0), 0);
  const unpaid = total - paid;

  const handlePay = async (fineId: string) => {
    await api.patch(`/fines/${fineId}/pay`);
    loadFines();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const fineType = fineTypes.find((ft) => ft.id === newFineTypeId);
    const amount = newAmount ? parseInt(newAmount) : fineType?.amount || 0;
    await api.post("/fines", {
      player_id: playerId,
      fine_type_id: newFineTypeId,
      amount,
      notes: newNotes || undefined,
    });
    setShowForm(false);
    setNewFineTypeId("");
    setNewAmount("");
    setNewNotes("");
    loadFines();
  };

  const handleSelectFineType = (id: string) => {
    setNewFineTypeId(id);
    const ft = fineTypes.find((f) => f.id === id);
    if (ft) setNewAmount(ft.amount.toString());
  };

  return (
    <div data-testid="page-fine-detail">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate("/fines")} data-testid="fine-detail-back">
          &larr; Tilbage
        </Button>
        <h1 className="text-2xl font-bold text-brand-black">{playerName}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-mid-gray">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums" data-testid="fine-detail-total">{total} kr</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-mid-gray">Betalt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-accent-green">{paid} kr</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-mid-gray">Ubetalt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-brand-red">{unpaid} kr</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowForm(!showForm)} data-testid="fine-add-button">
          Tilføj bøde
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="flex gap-4 items-end flex-wrap" data-testid="fine-create-form">
              <div>
                <label className="text-xs font-medium text-neutral-mid-gray">Type</label>
                <select
                  value={newFineTypeId}
                  onChange={(e) => handleSelectFineType(e.target.value)}
                  className="block w-48 rounded-md border border-neutral-light-gray px-3 py-2 text-sm"
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
                <label className="text-xs font-medium text-neutral-mid-gray">Beløb</label>
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
                <label className="text-xs font-medium text-neutral-mid-gray">Noter</label>
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-brand-black hover:bg-brand-black">
                <TableHead className="text-white">Dato</TableHead>
                <TableHead className="text-white">Begivenhed</TableHead>
                <TableHead className="text-white">Type</TableHead>
                <TableHead className="text-white text-right">Beløb</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fines.map((f) => (
                <TableRow key={f.id} data-testid={`fine-row-${f.id}`}>
                  <TableCell className="tabular-nums">
                    {f.event_date || f.created_at.split("T")[0]}
                  </TableCell>
                  <TableCell>{f.event_name || f.notes || "—"}</TableCell>
                  <TableCell>{f.fine_type_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{f.amount} kr</TableCell>
                  <TableCell>
                    {f.paid ? (
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-accent-green" data-testid="fine-status-paid">
                        Betalt
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-red-100 text-brand-red" data-testid="fine-status-unpaid">
                        Ubetalt
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!f.paid && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePay(f.id)}
                        data-testid={`fine-pay-${f.id}`}
                      >
                        Markér betalt
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
