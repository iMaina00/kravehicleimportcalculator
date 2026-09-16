import type { CalculationResult } from "@/lib/calculator/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const kes = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 });

export function ResultsBreakdown({
  result,
  meta,
}: {
  result: CalculationResult;
  meta: { datasetName: string | null; taxRuleVersionName: string | null };
}) {
  const lines = [result.importDuty, result.exciseDuty, result.vat, result.rdl, result.idf];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Step-by-step calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-3">
            <Stat label="CRSP from the schedule" value={kes.format(result.crspKes)} />
            <Stat label={`Depreciation (${result.ageYears} yr, ${result.depreciation.label})`} value={`${result.depreciation.percentage.toFixed(0)}%`} />
            <Stat label="Customs value" value={kes.format(result.customsValue.result)} />
          </dl>
          <p className="rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
            {result.customsValue.formula}
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Charge</TableHead>
                <TableHead>Calculated on</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={l.key}>
                  <TableCell>
                    <span className="font-medium">{l.label}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">{l.formula}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {l.baseLabel}
                    <span className="block">{kes.format(l.base)}</span>
                  </TableCell>
                  <TableCell>{l.rate === null ? "Fixed" : `${(l.rate * 100).toFixed(2)}%`}</TableCell>
                  <TableCell className="text-right font-semibold">{kes.format(l.result)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="font-semibold">
                  Total government taxes &amp; levies
                </TableCell>
                <TableCell className="text-right text-lg font-bold">
                  {kes.format(result.totalGovernmentTaxes)}
                </TableCell>
              </TableRow>
              {result.importType === "previously_registered" && (
                <TableRow>
                  <TableCell colSpan={3} className="text-sm text-muted-foreground">
                    Workbook total for previously registered units (duty + excise + VAT only)
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {kes.format(result.workbookPreviouslyRegisteredTotal)}
                  </TableCell>
                </TableRow>
              )}
              {result.otherImportCosts.total > 0 && (
                <>
                  <TableRow>
                    <TableCell colSpan={3}>
                      Other import costs (purchase, freight, insurance, other) converted at{" "}
                      {result.otherImportCosts.exchangeRateToKes ?? "—"} KES/{result.otherImportCosts.currency}
                    </TableCell>
                    <TableCell className="text-right">{kes.format(result.otherImportCosts.total)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">
                      Estimated landed cost
                    </TableCell>
                    <TableCell className="text-right text-lg font-bold">
                      {kes.format(result.estimatedLandedCost)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Provenance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span>Category applied:</span>
            <Badge variant="secondary">{result.category.code}</Badge>
            <span>— {result.category.reason}</span>
          </div>
          <p>CRSP schedule: {meta.datasetName ?? "unknown"}</p>
          <p>Tax rule version: {meta.taxRuleVersionName ?? "unknown"}</p>
          <p className="font-mono text-xs">
            dataset {result.versions.datasetId} · tax rules {result.versions.taxRuleVersionId} · depreciation{" "}
            {result.versions.depreciationVersionId}
          </p>
        </CardContent>
      </Card>

      {result.warnings.length > 0 && (
        <Alert>
          <AlertTitle>Verify before relying on this figure</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Estimates are derived from the July 2025 CRSP schedule and the tax tabulations in the same workbook. Rates and
        schedules change; confirm the final assessment with KRA before committing funds.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}
