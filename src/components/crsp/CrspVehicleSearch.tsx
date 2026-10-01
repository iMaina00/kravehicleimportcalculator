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
import { Skeleton } from "@/components/ui/skeleton";

const fmt = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });
const CRSP_CEILING = 50_000_000;

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
  const [pageSize, setPageSize] = useState(20);

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
      limit: pageSize,
      offset: page * pageSize,
    }),
    [pageSize, query, makes, models, trims, fuels, transmissions, drives, bodies, seats, ccMin, ccMax, crspRange, sort, page],
  );

  const run = useServerFn(crspSearch);
  const { data, isFetching, error } = useQuery({
    queryKey: ["crsp-search", filters],
    queryFn: () => run({ data: filters }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const rows = (data?.records ?? []) as Row[];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstLoad = isFetching && !data;

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
          <SheetContent side="left" className="w-[min(320px,90vw)] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{filterPanel}</div>
          </SheetContent>
        </Sheet>

        <p className="text-sm font-medium">
          {isFetching ? "Searching…" : `${fmt.format(total)} vehicle${total === 1 ? "" : "s"} found`}
        </p>

        <div className="w-full sm:ml-auto sm:w-[190px]">
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
            <Badge key={c.label} variant="secondary" className="h-auto gap-1 whitespace-normal break-words py-1">
              {c.label}
              <button type="button" className="p-1" aria-label={`Remove ${c.label}`} onClick={c.onRemove}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset filters
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden lg:block">{filterPanel}</aside>

        <div className="min-w-0 space-y-3" aria-busy={isFetching}>
          {error && <p className="text-sm text-destructive">Search failed: {(error as Error).message}</p>}
          {firstLoad && (
            <div className="space-y-3" aria-label="Loading vehicles">
              <p className="text-sm text-muted-foreground">Loading vehicles…</p>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 py-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {!isFetching && !error && rows.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="font-medium">No vehicles found.</p>
              <p className="mt-1 text-sm text-muted-foreground">Try changing your search or filters.</p>
            </div>
          )}
          <div className={isFetching && data ? "space-y-3 opacity-60 transition-opacity" : "space-y-3"}>

          {rows.map((r) => {
            const crsp = r["crsp_kes"] == null ? null : Number(r["crsp_kes"]);
            const modelNumber = (r["model_number"] as string | null) ?? "";
            const mk = String(r["make"] ?? "").trim();
            const md = String(r["model"] ?? "").trim();
            const name = md.toUpperCase().startsWith(mk.toUpperCase()) ? md : `${mk} ${md}`;
            const details: [string, unknown][] = [
              ["Model number", modelNumber || "—"],
              ["Engine", r["engine_capacity_raw"]],
              ["Fuel", r["fuel_label"]],
              ["Transmission", r["transmission_normalized"]],
              ["Drive", r["drive_normalized"]],
              ["Body type", r["body_normalized"]],
              ["Seating", r["seating"]],
              ["GVW", r["gvw"]],
            ];
            return (
              <Card key={String(r["id"])} className="transition-colors hover:border-primary">
                <CardContent className="space-y-3 py-4">
                  <p className="break-words text-base font-semibold leading-snug sm:text-lg">{name}</p>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                    {details
                      .filter(([, v]) => v != null && String(v).trim() !== "")
                      .map(([k, v]) => (
                        <div key={k} className="min-w-0">
                          <dt className="text-xs text-muted-foreground">{k}</dt>
                          <dd className="break-words font-medium">{String(v)}</dd>
                        </div>
                      ))}
                  </dl>
                  <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">CRSP</p>
                      <p className="break-words text-xl font-bold text-primary">
                        {crsp === null ? "Not in source" : `KES ${fmt.format(crsp)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">CRSP row {String(r["source_row"] ?? "")}</p>
                    </div>
                    <Button
                      className="h-11 w-full sm:w-auto"
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
          </div>

          {total > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {fmt.format(page * pageSize + 1)} to {fmt.format(Math.min((page + 1) * pageSize, total))} of{" "}
                  {fmt.format(total)} vehicles
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Per page</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => {
                      setPageSize(Number(v));
                      setPage(0);
                    }}
                  >
                    <SelectTrigger className="w-[90px]" aria-label="Results per page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[20, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {pageCount > 1 && (
                <div className="flex items-center justify-between gap-2">
                  <Button variant="outline" className="h-11" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <p className="text-sm sm:hidden">
                    Page {page + 1} of {fmt.format(pageCount)}
                  </p>
                  <div className="hidden flex-wrap items-center gap-1 sm:flex">
                    {pageWindow(page, pageCount).map((p, i) =>
                      p === -1 ? (
                        <span key={`gap${i}`} className="px-2 text-muted-foreground">…</span>
                      ) : (
                        <Button
                          key={p}
                          size="sm"
                          variant={p === page ? "default" : "ghost"}
                          onClick={() => setPage(p)}
                        >
                          {p + 1}
                        </Button>
                      ),
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="h-11"
                    disabled={page + 1 >= pageCount}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function pageWindow(page: number, count: number): number[] {
  const start = Math.max(0, Math.min(page - 2, count - 5));
  const end = Math.min(count, start + 5);
  const out: number[] = [];
  if (start > 0) out.push(0, -1);
  for (let i = start; i < end; i++) out.push(i);
  if (end < count) out.push(-1, count - 1);
  return out;
}
