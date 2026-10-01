import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const DEFAULT_CLEARING_COSTS = [
  { key: "agent", label: "Clearing agent fee", amount: 35_000 },
  { key: "port", label: "Port handling", amount: 25_000 },
  { key: "kebs", label: "KEBS / inspection", amount: 18_000 },
  { key: "qisj", label: "QISJ validation (if no CoR)", amount: 12_000 },
  { key: "ntsa", label: "NTSA registration", amount: 15_000 },
  { key: "transport", label: "Local transport", amount: 22_000 },
  { key: "insdocs", label: "Insurance & docs", amount: 25_000 },
] as const;

export type ClearingValues = Record<string, string>;

export const defaultClearingValues = (): ClearingValues =>
  Object.fromEntries(DEFAULT_CLEARING_COSTS.map((c) => [c.key, String(c.amount)]));

export const clearingTotal = (v: ClearingValues) =>
  DEFAULT_CLEARING_COSTS.reduce((s, c) => s + (Number(v[c.key]) || 0), 0);

const fmt = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

export function ClearingCosts({
  values,
  onChange,
}: {
  values: ClearingValues;
  onChange: (v: ClearingValues) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Clearing / Port Cost Estimates</CardTitle>
        <p className="text-sm text-muted-foreground">
          Estimates only — edit any amount. These are added after the KRA taxes and are not part of the tax calculation.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {DEFAULT_CLEARING_COSTS.map((c) => (
            <div key={c.key}>
              <Label htmlFor={`cc-${c.key}`}>{c.label} (KES)</Label>
              <Input
                id={`cc-${c.key}`}
                inputMode="numeric"
                className="h-11"
                value={values[c.key] ?? ""}
                onChange={(e) => onChange({ ...values, [c.key]: e.target.value.replace(/[^0-9.]/g, "") })}
              />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="text-sm text-muted-foreground">Total Clearing / Port Costs</span>
            <span className="block text-xl font-bold">KES {fmt.format(clearingTotal(values))}</span>
          </p>
          <Button variant="outline" className="h-11" onClick={() => onChange(defaultClearingValues())}>
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
