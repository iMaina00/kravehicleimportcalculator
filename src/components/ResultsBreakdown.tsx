import type { CalculationResult } from "@/lib/calculator/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const kes = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 });

export function ResultsBreakdown({
  result,
  meta,
  clearingTotal = 0,
}: {
  result: CalculationResult;
  meta: { datasetName: string | null; taxRuleVersionName: string | null };
  clearingTotal?: number;
}) {
  const lines = [result.importDuty, result.exciseDuty, result.vat, result.rdl, result.idf];
  const manual = result.valuationSource === "manual_cif";
  const vehicleName = [result.vehicle.make, result.vehicle.model].filter(Boolean).join(" ");
  const vehicleCif =
    manual && result.otherImportCosts.total === 0 ? (result.cifKes ?? 0) : result.otherImportCosts.total;
  const finalCost = vehicleCif + result.totalGovernmentTaxes + clearingTotal;

  return (
    <div className="space-y-6">
      <div className="glass-chip rounded-2xl border border-border p-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vehicle details &amp; valuation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {vehicleName && <p className="break-words font-display text-lg font-semibold">{vehicleName}</p>}
          <dl className="grid gap-3 sm:grid-cols-3">
            <Stat label="Valuation source" value={manual ? "Manual entry (not in CRSP)" : "CRSP Database"} />
            {manual ? (
              <Stat label="Vehicle value entered (KES)" value={kes.format(result.cifKes ?? 0)} />
            ) : (
              <Stat label="CRSP from the schedule" value={kes.format(result.crspKes)} />
            )}
            <Stat
              label={`Depreciation (${result.ageYears} yr, ${result.depreciation.label})`}
              value={`${result.depreciation.percentage.toFixed(0)}%`}
            />
            <Stat label="Customs value" value={kes.format(result.customsValue.result)} />
          </dl>
          <p className="break-words rounded-lg border border-border/60 bg-black/20 p-3 font-mono text-xs text-muted-foreground">
            {result.customsValue.formula}
          </p>
        </CardContent>
      </div>

      <div className="glass-chip rounded-2xl border border-border p-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">KRA taxes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lines.map((l) => (
            <div key={l.key} className="grid gap-1 border-b border-border/60 pb-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
              <div className="min-w-0">
                <p className="font-medium">
                  {l.label}{" "}
                  <span className="text-sm font-normal text-primary tabular-nums">
                    ({l.rate === null ? "Fixed" : `${(l.rate * 100).toFixed(2)}%`})
                  </span>
                </p>
                <p className="break-words text-sm text-muted-foreground tabular-nums">
                  {l.baseLabel}: {kes.format(l.base)}
                </p>
                <p className="break-words font-mono text-[11px] text-muted-foreground">{l.formula}</p>
              </div>
              <p className="font-semibold tabular-nums sm:text-right">{kes.format(l.result)}</p>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1">
            <p className="font-semibold">Total government taxes &amp; levies</p>
            <p className="font-display text-lg font-bold tabular-nums">{kes.format(result.totalGovernmentTaxes)}</p>
          </div>
          {result.importType === "previously_registered" && (
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-muted-foreground">
              <p>Workbook total for previously registered units (duty + excise + VAT only)</p>
              <p className="tabular-nums">{kes.format(result.workbookPreviouslyRegisteredTotal)}</p>
            </div>
          )}
        </CardContent>
      </div>

      <div className="rounded-2xl border border-primary/50 bg-primary/[0.07] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_36px_rgba(36,91,255,0.18)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Final estimated cost</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Row
            label={`Vehicle / CIF (purchase, freight, insurance, other${
              result.otherImportCosts.currency !== "KES"
                ? ` at ${result.otherImportCosts.exchangeRateToKes ?? "—"} KES/${result.otherImportCosts.currency}`
                : ""
            })`}
            value={kes.format(vehicleCif)}
          />
          <Row label="KRA taxes" value={kes.format(result.totalGovernmentTaxes)} />
          <Row label="Clearing / Port costs (editable estimates)" value={kes.format(clearingTotal)} />
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-primary/30 pt-3">
            <p className="font-semibold">Final Estimated Cost</p>
            <p className="font-display text-3xl font-bold text-acid tabular-nums">{kes.format(finalCost)}</p>
          </div>
          {vehicleCif === 0 && (
            <p className="text-xs text-muted-foreground">
              No purchase price or freight entered, so the vehicle cost line is zero.
            </p>
          )}
        </CardContent>
      </div>

      <div className="glass-chip rounded-2xl border border-border p-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Provenance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 break-words text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span>Category applied:</span>
            <Badge variant="secondary">{result.category.code}</Badge>
            <span>— {result.category.reason}</span>
          </div>
          <p>CRSP schedule: {meta.datasetName ?? "unknown"}</p>
          <p>Tax rule version: {meta.taxRuleVersionName ?? "unknown"}</p>
          <p className="break-all font-mono text-xs">
            dataset {result.versions.datasetId} · tax rules {result.versions.taxRuleVersionId} · depreciation{" "}
            {result.versions.depreciationVersionId}
          </p>
        </CardContent>
      </div>

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
        Estimates are derived from the CRSP schedule and the tax tabulations in the same workbook. Rates and schedules
        change; confirm the final assessment with KRA before committing funds.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <p className="min-w-0 break-words text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-chip rounded-xl border border-border p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words font-display text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
