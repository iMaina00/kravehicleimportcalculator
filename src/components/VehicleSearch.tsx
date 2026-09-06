import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { findCrspRecords, searchRecords } from "@/lib/calculator.functions";
import { CrspCombobox } from "@/components/CrspCombobox";
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
  const [recordType, setRecordType] = useState<RecordType>("vehicle");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [query, setQuery] = useState("");

  const runFind = useServerFn(findCrspRecords);
  const find = useMutation({
    mutationFn: (vars: { make: string; model: string; modelNumber: string }) =>
      runFind({
        data: {
          recordType,
          make: vars.make,
          model: vars.model || null,
          modelNumber: vars.modelNumber || null,
          limit: 100,
        },
      }),
  });

  const runSearch = useServerFn(searchRecords);
  const search = useMutation({
    mutationFn: (vars: { query: string }) =>
      runSearch({ data: { query: vars.query, recordType, limit: 25 } }),
  });

  // Cascading lookup: results appear as soon as a Make (and optionally Model) is chosen.
  useEffect(() => {
    if (make) find.mutate({ make, model, modelNumber });
    else find.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [make, model, modelNumber, recordType]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) search.mutate({ query });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, recordType]);

  const usingKeyword = !make && query.trim().length >= 2;
  const rows = (usingKeyword ? search.data?.records : find.data?.records) as
    | Array<Record<string, unknown>>
    | undefined;
  const list = rows ?? [];
  const pending = usingKeyword ? search.isPending : find.isPending;
  const error = usingKeyword ? search.error : find.error;

  const reset = () => {
    setMake("");
    setModel("");
    setModelNumber("");
    setQuery("");
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={recordType}
        onValueChange={(v) => {
          setRecordType(v as RecordType);
          reset();
        }}
      >
        <TabsList>
          <TabsTrigger value="vehicle">Motor vehicles</TabsTrigger>
          <TabsTrigger value="motorcycle">Motorcycles</TabsTrigger>
          <TabsTrigger value="machinery">Tractors &amp; graders</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-3 md:grid-cols-3">
        <CrspCombobox
          id="make"
          label="Make"
          field="make"
          recordType={recordType}
          value={make}
          placeholder="Click or type, e.g. TOY"
          onChange={(v) => {
            setMake(v);
            setModel("");
            setModelNumber("");
          }}
        />
        <CrspCombobox
          id="model"
          label="Model"
          field="model"
          recordType={recordType}
          make={make || null}
          value={model}
          disabled={!make}
          disabledHint="Select a Make first"
          placeholder="e.g. RAV"
          onChange={(v) => {
            setModel(v);
            setModelNumber("");
          }}
        />
        {recordType !== "machinery" && (
          <CrspCombobox
            id="model-number"
            label="Model number"
            field="model_number"
            recordType={recordType}
            make={make || null}
            model={model || null}
            value={modelNumber}
            disabled={!make || !model}
            disabledHint="Select a Make and Model first"
            placeholder="e.g. WAU"
            onChange={setModelNumber}
          />
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px] flex-1">
          <Label htmlFor="q">Or search the whole CRSP schedule</Label>
          <Input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Toyota Land Cruiser 2800 diesel"
            autoComplete="off"
            disabled={!!make}
          />
        </div>
        {(make || query) && (
          <Button variant="outline" size="sm" onClick={reset}>
            Clear
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">Search failed: {(error as Error).message}</p>}

      <div className="space-y-2">
        {pending && <p className="text-sm text-muted-foreground">Searching…</p>}
        {!pending && (make || usingKeyword) && list.length === 0 && (
          <p className="text-sm text-muted-foreground">No CRSP records matched that combination.</p>
        )}
        {!pending && make && list.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {list.length} CRSP record{list.length === 1 ? "" : "s"} — each row is a separate spreadsheet entry.
          </p>
        )}
        {list.map((r) => {
          const crsp = r["crsp_kes"] === null || r["crsp_kes"] === undefined ? null : Number(r["crsp_kes"]);
          const flags = (r["flags"] as string[] | null) ?? [];
          const mn = (r["model_number"] as string | null) ?? "";
          return (
            <Card key={String(r["id"])} className="transition-colors hover:border-primary">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {String(r["make"] ?? "")} {String(r["model"] ?? "")}
                    {mn ? <span className="text-muted-foreground"> · {mn}</span> : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[
                      r["engine_capacity_raw"],
                      r["fuel_raw"],
                      r["body_type"],
                      r["transmission"],
                      r["drive_configuration"],
                      r["gvw"],
                      r["seating"],
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
                        engineCapacityCc:
                          r["engine_capacity_cc"] === null || r["engine_capacity_cc"] === undefined
                            ? null
                            : Number(r["engine_capacity_cc"]),
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
