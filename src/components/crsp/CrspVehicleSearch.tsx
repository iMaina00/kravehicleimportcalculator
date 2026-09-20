import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { crspSearch } from "@/lib/calculator.functions";
import { FacetSelect } from "@/components/crsp/FacetSelect";
import type { SelectedRecord } from "@/components/VehicleSearch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

const fmt = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });
const CRSP_CEILING = 50_000_000;
const PAGE_SIZE = 25;

type Row = Record<string, unknown>;

interface Chip {
  label: string;
  onRemove: () => void;
}

export function CrspVehicleSearch({ onSelect }: { onSelect: (record: SelectedRecord) => void }) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [trims, setTrims] = useState<string[]>([]);
  const [fuels, setFuels] = useState<string[]>([]);
  const [transmissions, setTransmissions] = useState<string[]>([]);
  const [drives, setDrives] = useState<string[]>([]);
  const [bodies, setBodies] = useState<string[]>([]);
  const [seats, setSeats] = useState<string[]>([]);
  const [ccMin, setCcMin] = useState("");
  const [ccMax, setCcMax] = useState("");
  const [crspRange, setCrspRange] = useState<[number, number]>([0, CRSP_CEILING]);
  const [sort, setSort] = useState<string>("make_asc");
  const [sortTouched, setSortTouched] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(input.trim());
      setPage(0);
    }, 250);
    return () => clearTimeout(t);
  }, [input]);

  // Relevance by default when searching, Make A-Z when browsing.
  useEffect(() => {
    if (!sortTouched) setSort(query ? "relevance" : "make_asc");
  }, [query, sortTouched]);

  const filters = useMemo(
    () => ({
      query,
      makes,
      models,
      trims,
      fuels,
      transmissions,
      drives,
      bodies,
      seats: seats.map(Number).filter((n) => Number.isFinite(n)),
      ccMin: ccMin ? Number(ccMin) : null,
      ccMax: ccMax ? Number(ccMax) : null,
      crspMin: crspRange[0] > 0 ? crspRange[0] : null,
      crspMax: crspRange[1] < CRSP_CEILING ? crspRange[1] : null,
      sort: sort as "relevance",
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }),
    [query, makes, models, trims, fuels, transmissions, drives, bodies, seats, ccMin, ccMax, crspRange, sort, page],
  );

  const run = useServerFn(crspSearch);
  const { data, isFetching, error } = useQuery({
    queryKey: ["crsp-search", filters],
    queryFn: () => run({ data: filters }),
    staleTime: 30_000,
  });

  const rows = (data?.records ?? []) as Row[];
  const total = data?.total ?? 0;

  const resetFilters = () => {
    setMakes([]);
    setModels([]);
    setTrims([]);
    setFuels([]);
    setTransmissions([]);
    setDrives([]);
    setBodies([]);
    setSeats([]);
    setCcMin("");
    setCcMax("");
    setCrspRange([0, CRSP_CEILING]);
    setPage(0);
  };

  const chipsFor = (values: string[], set: (v: string[]) => void, prefix: string): Chip[] =>
    values.map((v) => ({
      label: `${prefix}: ${v}`,
      onRemove: () => {
        set(values.filter((x) => x !== v));
        setPage(0);
      },
    }));

  const chips: Chip[] = [
    ...chipsFor(makes, setMakes, "Make"),
    ...chipsFor(models, setModels, "Model"),
    ...chipsFor(trims, setTrims, "Trim"),
    ...chipsFor(fuels, setFuels, "Fuel"),
    ...chipsFor(transmissions, setTransmissions, "Transmission"),
    ...chipsFor(drives, setDrives, "Drive"),
    ...chipsFor(bodies, setBodies, "Body"),
    ...chipsFor(seats, setSeats, "Seats"),
  ];
  if (ccMin) chips.push({ label: `Min ${ccMin}cc`, onRemove: () => setCcMin("") });
  if (ccMax) chips.push({ label: `Max ${ccMax}cc`, onRemove: () => setCcMax("") });
  if (crspRange[0] > 0 || crspRange[1] < CRSP_CEILING)
    chips.push({
      label: `CRSP ${fmt.format(crspRange[0])} – ${fmt.format(crspRange[1])}`,
      onRemove: () => setCrspRange([0, CRSP_CEILING]),
    });

  const wrap = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(0);
  };

  const filterPanel = (
    <div className="space-y-4">
      <FacetSelect field="make" label="Make" selected={makes} onChange={wrap(setMakes)} />
      <FacetSelect field="model" label="Model" selected={models} onChange={wrap(setModels)} makes={makes} />
      <FacetSelect
        field="trim"
        label="Trim"
        selected={trims}
        onChange={wrap(setTrims)}
        makes={makes}
        models={models}
        disabled={models.length === 0}
        disabledHint="Select a model first"
      />
      <FacetSelect field="fuel" label="Fuel" selected={fuels} onChange={wrap(setFuels)} makes={makes} models={models} trims={trims} />
      <FacetSelect
        field="transmission"
        label="Transmission"
        selected={transmissions}
        onChange={wrap(setTransmissions)}
        makes={makes}
        models={models}
        trims={trims}
      />
      <FacetSelect field="drive" label="Drive configuration" selected={drives} onChange={wrap(setDrives)} makes={makes} models={models} trims={trims} />
      <FacetSelect field="body" label="Body type" selected={bodies} onChange={wrap(setBodies)} makes={makes} models={models} trims={trims} />
      <FacetSelect field="seating" label="Seating" selected={seats} onChange={wrap(setSeats)} makes={makes} models={models} trims={trims} />

      <div>
        <p className="text-xs font-medium text-muted-foreground">Engine capacity (cc)</p>
        <div className="mt-1 flex items-center gap-2">
          <Input
            aria-label="Minimum engine cc"
            inputMode="numeric"
            placeholder="Min"
            value={ccMin}
            onChange={(e) => {
              setCcMin(e.target.value.replace(/[^0-9]/g, ""));
              setPage(0);
            }}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            aria-label="Maximum engine cc"
            inputMode="numeric"
            placeholder="Max"
            value={ccMax}
            onChange={(e) => {
              setCcMax(e.target.value.replace(/[^0-9]/g, ""));
              setPage(0);
            }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Electric units listed only with battery capacity are excluded when a cc range is set.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground">CRSP price (KES)</p>
        <Slider
          className="mt-3"
          min={0}
          max={CRSP_CEILING}
          step={250_000}
          value={crspRange}
          onValueChange={(v) => {
            setCrspRange([v[0] ?? 0, v[1] ?? CRSP_CEILING]);
            setPage(0);
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          KES {fmt.format(crspRange[0])} – {fmt.format(crspRange[1])}
        </p>
      </div>

      <Button variant="outline" size="sm" onClick={resetFilters} className="w-full">
        Reset filters
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="crsp-q">Search CRSP database</Label>
        <Input
          id="crsp-q"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search make, model, trim or model number"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[320px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{filterPanel}</div>
          </SheetContent>
        </Sheet>

        <p className="text-sm font-medium">
          {isFetching ? "Searching…" : `${fmt.format(total)} vehicle${total === 1 ? "" : "s"} found`}
        </p>

        <div className="ml-auto w-[190px]">
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v);
              setSortTouched(true);
              setPage(0);
            }}
          >
            <SelectTrigger aria-label="Sort results">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="crsp_asc">CRSP: Low to High</SelectItem>
              <SelectItem value="crsp_desc">CRSP: High to Low</SelectItem>
              <SelectItem value="make_asc">Make: A-Z</SelectItem>
              <SelectItem value="model_asc">Model: A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <Badge key={c.label} variant="secondary" className="gap-1">
              {c.label}
              <button type="button" aria-label={`Remove ${c.label}`} onClick={c.onRemove}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">{filterPanel}</aside>

        <div className="space-y-3">
          {error && <p className="text-sm text-destructive">Search failed: {(error as Error).message}</p>}
          {!isFetching && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">No CRSP records match this search.</p>
          )}

          {rows.map((r) => {
            const crsp = r["crsp_kes"] == null ? null : Number(r["crsp_kes"]);
            const specs = [
              r["engine_capacity_raw"],
              r["fuel_label"],
              r["transmission_normalized"],
              r["drive_normalized"],
              r["body_normalized"],
              r["seating"] ? `${String(r["seating"])} seats` : null,
              r["gvw"] ? `GVW ${String(r["gvw"])}` : null,
            ]
              .filter(Boolean)
              .map(String);
            const modelNumber = (r["model_number"] as string | null) ?? "";
            return (
              <Card key={String(r["id"])} className="transition-colors hover:border-primary">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {(() => {
                        const mk = String(r["make"] ?? "").trim();
                        const md = String(r["model"] ?? "").trim();
                        // The CRSP Model column sometimes repeats the make; show it once.
                        return md.toUpperCase().startsWith(mk.toUpperCase()) ? md : `${mk} ${md}`;
                      })()}
                    </p>
                    <p className="text-sm text-muted-foreground">{specs.join(" | ")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Model number: {modelNumber ? modelNumber : "—"} · CRSP row {String(r["source_row"] ?? "")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">CRSP</p>
                      <p className="text-lg font-bold text-primary">
                        {crsp === null ? "Not in source" : `KES ${fmt.format(crsp)}`}
                      </p>
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
                            r["engine_capacity_cc"] == null ? null : Number(r["engine_capacity_cc"]),
                          engineCapacityRaw: (r["engine_capacity_raw"] as string) ?? null,
                          fuel: (r["fuel_normalized"] as string) ?? null,
                          bodyType: (r["body_type"] as string) ?? null,
                          crspKes: crsp,
                          flags: ((r["flags"] as string[] | null) ?? []) as string[],
                          recordType: "vehicle",
                          extra: r,
                        })
                      }
                    >
                      Select vehicle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <p className="text-xs text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {fmt.format(total)}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
