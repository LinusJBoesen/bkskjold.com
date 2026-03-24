import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface PlayerSummary {
  id: string;
  display_name: string;
  total: number;
  paid: number;
  unpaid: number;
  fine_count: number;
}

export default function FinesOverviewPage() {
  const [summaries, setSummaries] = useState<PlayerSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<PlayerSummary[]>("/fines/summary").then(setSummaries).catch(() => {});
  }, []);

  const totalUnpaid = summaries.reduce((sum, s) => sum + s.unpaid, 0);
  const totalPaid = summaries.reduce((sum, s) => sum + s.paid, 0);

  return (
    <div data-testid="page-fines">
      <h1 className="text-2xl font-bold text-brand-black mb-6">{da.nav.fines}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-mid-gray">
              Total ubetalt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-brand-red" data-testid="fine-total-unpaid">
              {totalUnpaid} kr
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-mid-gray">
              Total betalt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-accent-green" data-testid="fine-total-paid">
              {totalPaid} kr
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-mid-gray">
              Spillere med bøder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums" data-testid="fine-player-count">
              {summaries.filter((s) => s.fine_count > 0).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-brand-black hover:bg-brand-black">
                <TableHead className="text-white">Navn</TableHead>
                <TableHead className="text-white text-right">Total</TableHead>
                <TableHead className="text-white text-right">Betalt</TableHead>
                <TableHead className="text-white text-right">Ubetalt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-neutral-light-gray"
                  onClick={() => navigate(`/fines/${s.id}`)}
                  data-testid={`fine-player-row-${s.id}`}
                >
                  <TableCell className="font-medium">{s.display_name}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.total} kr</TableCell>
                  <TableCell className="text-right tabular-nums text-accent-green">
                    {s.paid} kr
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-brand-red">
                    {s.unpaid} kr
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
