import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { da } from "@/i18n/da";
import { Banknote, CheckCircle, AlertTriangle, Users, ChevronRight, ExternalLink, Wallet } from "lucide-react";

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

export default function FinesOverviewPage() {
  const [summaries, setSummaries] = useState<PlayerSummary[]>([]);
  const [bodekasse, setBodekasse] = useState<BodekasseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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

  const totalUnpaid = summaries.reduce((sum, s) => sum + Number(s.unpaid), 0);
  const totalPaid = summaries.reduce((sum, s) => sum + Number(s.paid), 0);

  return (
    <div data-testid="page-fines" className="animate-fade-in-up">
      <h1 className="text-2xl font-bold text-zinc-50 tracking-tight mb-6">{da.nav.fines}</h1>

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
    </div>
  );
}
