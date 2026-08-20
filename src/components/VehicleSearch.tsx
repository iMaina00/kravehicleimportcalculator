import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { searchRecords } from "@/lib/calculator.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type RecordType = "vehicle" | "motorcycle" | "machinery";

export interface SelectedRecord {
  id: string;
  make: string | null;
  model: string | null;
  engineCapacityCc: number | null;
  engineCapacityRaw?: string | null;
  fuel: string | null;
  bodyType: string | null;
  crspKes: number | null;
  flags: string[];
  recordType: RecordType;
  extra: Record<string, unknown>;
}

const fmt = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

export function VehicleSearch({ onSelect }: { onSelect: (record: SelectedRecord) => void }) {
  const [query, setQuery] = useState("");
  const [recordType, setRecordType] = useState<RecordType>("vehicle");
  const [fuel, setFuel] = useState("");
  const [engineMin, setEngineMin] = useState("");
  const [engineMax, setEngineMax] = useState("");

  const run = useServerFn(searchRecords);
  const search = useMutation({
    mutationFn: (vars: { query: string }) =>
      run({
        data: {
          query: vars.query,
          recordType,
          fuel: fuel ? fuel.toUpperCase() : null,
          engineMin: engineMin ? Number(engineMin) : null,
          engineMax: engineMax ? Number(engineMax) : null,
          limit: 25,
        },
      }),
  });

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) search.mutate({ query });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, recordType, fuel, engineMin, engineMax]);

  const rows = (search.data?.records ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="space-y-4">
      <Tabs value={recordType} onValueChange={(v) => setRecordType(v as RecordType)}>
        <TabsList>
          <TabsTrigger value="vehicle">Motor vehicles</TabsTrigger>
          <TabsTrigger value="motorcycle">Motorcycles</TabsTrigger>
          <TabsTrigger value="machinery">Tractors &amp; graders</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label htmlFor="q">Search the CRSP schedule</Label>
          <Input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Toyota Land Cruiser 2800 diesel"
            autoComplete="off"
          />
        </div>
        {recordType === "vehicle" && (
          <>
            <div>
              <Label htmlFor="fuel">Fuel</Label>
              <Input id="fuel" value={fuel} onChange={(e) => setFuel(e.target.value)} placeholder="PETROL / DIESEL / ELECTRIC" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cmin">Min cc</Label>
                <Input id="cmin" inputMode="numeric" value={engineMin} onChange={(e) => setEngineMin(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cmax">Max cc</Label>
                <Input id="cmax" inputMode="numeric" value={engineMax} onChange={(e) => setEngineMax(e.target.value)} />
              </div>
            </div>
          </>
        )}
      </div>

      {search.isError && (
        <p className="text-sm text-destructive">Search failed: {(search.error as Error).message}</p>
      )}

      <div className="space-y-2">
        {search.isPending && query.length >= 2 && (
          <p className="text-sm text-muted-foreground">Searching…</p>
        )}
        {!search.isPending && query.trim().length >= 2 && rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No records matched. Try fewer words, or the manufacturer only.
          </p>
        )}
        {rows.map((r) => {
          const crsp = r["crsp_kes"] === null || r["crsp_kes"] === undefined ? null : Number(r["crsp_kes"]);
          const flags = (r["flags"] as string[] | null) ?? [];
          return (
            <Card key={String(r["id"])} className="transition-colors hover:border-primary">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {String(r["make"] ?? "")} {String(r["model"] ?? "")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[
                      r["engine_capacity_raw"],
                      r["fuel_raw"],
                      r["body_type"],
                      r["transmission"],
                      r["drive_configuration"],
                      r["rating_raw"],
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {flags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {flags.map((f) => (
                        <Badge key={f} variant="outline" className="text-[10px]">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">CRSP</p>
                    <p className="font-semibold">{crsp === null ? "Not in source" : `KES ${fmt.format(crsp)}`}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={crsp === null}
                    onClick={() =>
                      onSelect({
                        id: String(r["id"]),
                        make: (r["make"] as string) ?? null,
                        model: (r["model"] as string) ?? null,
                        engineCapacityCc: r["engine_capacity_cc"] === null || r["engine_capacity_cc"] === undefined ? null : Number(r["engine_capacity_cc"]),
                        engineCapacityRaw: (r["engine_capacity_raw"] as string) ?? null,
                        fuel: (r["fuel_normalized"] as string) ?? null,
                        bodyType: (r["body_type"] as string) ?? null,
                        crspKes: crsp,
                        flags,
                        recordType,
                        extra: r,
                      })
                    }
                  >
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
