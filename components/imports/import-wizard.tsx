"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseCsv, guessMapping } from "@/lib/csv";
import { confirmImport, validateImportRows } from "@/app/(app)/leads/importar/actions";
import { LEAD_FIELD_LABELS } from "@/types/imports";
import type { ColumnMapping, LeadField, ValidatedRow } from "@/types/imports";

const FIELD_OPTIONS = Object.entries(LEAD_FIELD_LABELS) as [LeadField, string][];

const STEP_LABELS = ["Arquivo", "Mapeamento", "Revisão", "Resultado"];

export function ImportWizard({ campaigns }: { campaigns: { id: string; name: string }[] }) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [campaignId, setCampaignId] = useState<string>("");

  const [validatedRows, setValidatedRows] = useState<ValidatedRow[] | null>(null);
  const [result, setResult] = useState<{ importId: string; total: number; novos: number; duplicados: number; erros: number } | null>(
    null,
  );

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { headers: h, rows } = parseCsv(text);
      setHeaders(h);
      setRawRows(rows);
      setMapping(guessMapping(h) as ColumnMapping);
    };
    reader.readAsText(file, "utf-8");
  }

  function goToMapping() {
    if (!rawRows.length) {
      toast.error("Selecione um arquivo CSV com pelo menos uma linha de dados.");
      return;
    }
    setStep(2);
  }

  function goToReview() {
    startTransition(async () => {
      try {
        const validated = await validateImportRows(rawRows, mapping);
        setValidatedRows(validated);
        setStep(3);
      } catch {
        toast.error("Não foi possível validar o arquivo.");
      }
    });
  }

  function handleConfirm() {
    if (!validatedRows) return;
    startTransition(async () => {
      try {
        const res = await confirmImport({
          fileName,
          campaignId: campaignId || null,
          source: "csv",
          rows: validatedRows,
        });
        setResult(res);
        setStep(4);
        toast.success("Importação concluída.");
      } catch {
        toast.error("Não foi possível concluir a importação.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {STEP_LABELS.map((label, index) => (
          <span key={label} className="flex items-center gap-2">
            <Badge variant={step === index + 1 ? "default" : "outline"}>{index + 1}</Badge>
            {label}
            {index < STEP_LABELS.length - 1 && <span className="mx-1">→</span>}
          </span>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arquivo e contexto</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="file">Arquivo CSV</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
              {rawRows.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {fileName} · {rawRows.length} linha(s) detectada(s), {headers.length} coluna(s).
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="campaign">Campanha (opcional)</Label>
              <select
                id="campaign"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              >
                <option value="">Não vincular a nenhuma campanha</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Button onClick={goToMapping} disabled={rawRows.length === 0}>
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mapeamento de colunas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1">Coluna da planilha</th>
                    <th className="px-2 py-1">Exemplo</th>
                    <th className="px-2 py-1">Campo da Central</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {headers.map((header, index) => (
                    <tr key={index}>
                      <td className="px-2 py-1.5 font-medium">{header}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{rawRows[0]?.[index] ?? "—"}</td>
                      <td className="px-2 py-1.5">
                        <select
                          value={mapping[index] ?? "ignore"}
                          onChange={(e) => setMapping((m) => ({ ...m, [index]: e.target.value as LeadField }))}
                          className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
                        >
                          {FIELD_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button onClick={goToReview} disabled={isPending}>
                {isPending ? "Validando..." : "Validar e revisar"}
              </Button>
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && validatedRows && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisão</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex gap-4 text-sm">
              <span>
                Total: <strong>{validatedRows.length}</strong>
              </span>
              <span className="text-primary">
                Novos: <strong>{validatedRows.filter((r) => r.status === "novo").length}</strong>
              </span>
              <span className="text-muted-foreground">
                Duplicados: <strong>{validatedRows.filter((r) => r.status === "duplicado").length}</strong>
              </span>
              <span className="text-destructive">
                Erros: <strong>{validatedRows.filter((r) => r.status === "erro").length}</strong>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Apenas os registros marcados como &quot;novo&quot; serão criados. Duplicados e erros ficam
              registrados no relatório da importação, sem gerar um novo lead.
            </p>
            <div className="max-h-96 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-2 py-1">#</th>
                    <th className="px-2 py-1">Nome</th>
                    <th className="px-2 py-1">Empresa</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {validatedRows.map((row) => (
                    <tr key={row.rowIndex}>
                      <td className="px-2 py-1">{row.rowIndex + 1}</td>
                      <td className="px-2 py-1">{row.values.name ?? "—"}</td>
                      <td className="px-2 py-1 text-muted-foreground">{row.values.trade_name ?? "—"}</td>
                      <td className="px-2 py-1">
                        <Badge
                          variant={
                            row.status === "novo" ? "default" : row.status === "erro" ? "destructive" : "outline"
                          }
                        >
                          {row.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-1 text-xs text-muted-foreground">{row.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleConfirm} disabled={isPending}>
                {isPending ? "Importando..." : "Confirmar importação"}
              </Button>
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Importação concluída
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <p className="text-xl font-semibold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-primary">{result.novos}</p>
                <p className="text-xs text-muted-foreground">Incluídos</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{result.duplicados}</p>
                <p className="text-xs text-muted-foreground">Ignorados (duplicados)</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-destructive">{result.erros}</p>
                <p className="text-xs text-muted-foreground">Erros</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/leads")}>Ver Base de Leads</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setFileName("");
                  setHeaders([]);
                  setRawRows([]);
                  setValidatedRows(null);
                  setResult(null);
                }}
              >
                <Upload className="h-4 w-4" />
                Nova importação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
