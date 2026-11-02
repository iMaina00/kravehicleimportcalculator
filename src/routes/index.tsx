import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Car, Landmark, ListChecks } from "lucide-react";
import { VehicleSearch, type SelectedRecord } from "@/components/VehicleSearch";
import { CrspVehicleSearch } from "@/components/crsp/CrspVehicleSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResultsBreakdown } from "@/components/ResultsBreakdown";
import { ClearingCosts, clearingTotal, defaultClearingValues } from "@/components/ClearingCosts";
import { calculateTaxes } from "@/lib/calculator.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CalculationResult, CategoryCode, ImportType } from "@/lib/calculator/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kenya Vehicle Import Tax Calculator | CRSP-based duty estimates" },
      {
        name: "description",
        content:
          "Estimate Kenyan import duty, excise, VAT, RDL and IDF from the official CRSP schedule. Search 5,800+ vehicles, motorcycles and machinery and see every step of the calculation.",
      },
      { property: "og:title", content: "Kenya Vehicle Import Tax Calculator" },
      {
        property: "og:description",
        content:
          "CRSP-based import duty, excise, VAT, RDL and IDF estimates with a full, sourced calculation breakdown.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CATEGORIES: { value: CategoryCode; label: string }[] = [
  { value: "UNDER_1500CC", label: "Vehicle up to 1500cc" },
  { value: "OVER_1500CC", label: "Vehicle above 1500cc" },
  { value: "LARGE_ENGINE", label: "Large engine (petrol >3000cc / diesel >2500cc)" },
  { value: "ELECTRIC_PASSENGER", label: "Electric vehicle (persons)" },
  { value: "SCHOOL_BUS_PUBLIC", label: "School bus / public transport" },
  { value: "PRIME_MOVER", label: "Prime mover" },
  { value: "TRAILER", label: "Trailer" },
  { value: "AMBULANCE", label: "Ambulance" },
  { value: "MOTORCYCLE", label: "Motorcycle" },
  { value: "SPECIAL_PURPOSE", label: "Special purpose vehicle" },
  { value: "HEAVY_MACHINERY", label: "Tractor / grader / heavy machinery" },
];

function StepHeading({
  step,
  title,
  icon,
}: {
  step: string;
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <CardHeader className="pb-2">
      <div className="flex items-center gap-3">
        <span className="glass-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-xs font-semibold text-acid tabular-nums">
          {step}
        </span>
        <CardTitle className="flex items-center gap-2 break-words text-base">
          {icon}
          {title}
        </CardTitle>
      </div>
    </CardHeader>
  );
}

function Index() {
  const [record, setRecord] = useState<SelectedRecord | null>(null);
  const [tab, setTab] = useState("vehicle");
  const [importType, setImportType] = useState<ImportType>("direct");
  const [year, setYear] = useState(String(new Date().getFullYear() - 5));
  const [categoryOverride, setCategoryOverride] = useState<string>("auto");
  const [currency, setCurrency] = useState("KES");
  const [rates, setRates] = useState<Record<string, string>>({ USD: "130.00", GBP: "175.00" });
  const [purchasePrice, setPurchasePrice] = useState("");
  const [freight, setFreight] = useState("");
  const [insurance, setInsurance] = useState("");
  const [otherCosts, setOtherCosts] = useState("");
  const [mode, setMode] = useState<"crsp" | "manual">("crsp");
  const [manual, setManual] = useState({
    make: "",
    model: "",
    trim: "",
    regYear: "",
    cif: "",
    engineCc: "",
    fuel: "",
    transmission: "",
    drive: "",
    bodyType: "",
  });
  const [manualErrors, setManualErrors] = useState<string[]>([]);
  const [clearing, setClearing] = useState(defaultClearingValues);
  const setM = (k: keyof typeof manual) => (v: string) => {
    setManual((m) => ({ ...m, [k]: v }));
    calc.reset();
  };

  const validateManual = (): string[] => {
    const e: string[] = [];
    if (!(Number(manual.cif) > 0)) e.push("Enter the vehicle value in KES.");
    if (!manual.fuel) e.push("Select the fuel type.");
    if (manual.fuel !== "ELECTRIC" && !(Number(manual.engineCc) > 0)) e.push("Enter the engine capacity in cc.");
    if (!manual.transmission) e.push("Select the transmission.");
    if (!manual.drive) e.push("Select the drive configuration.");
    const y = Number(year);
    if (!(y >= 1950 && y <= new Date().getFullYear() + 1)) e.push("Enter a valid year of manufacture.");
    if (importType === "previously_registered" && !(Number(manual.regYear) >= 1950))
      e.push("Enter the registration year for a previously registered vehicle.");
    return e;
  };

  const rateValue = currency === "KES" ? 1 : Number(rates[currency] ?? 0);
  const kesEquivalent =
    purchasePrice && rateValue > 0 ? Number(purchasePrice) * rateValue : null;

  const run = useServerFn(calculateTaxes);
  const calc = useMutation({
    mutationFn: () =>
      run({
        data: {
          vehicle:
            mode === "manual"
              ? {
                  id: null,
                  make: manual.make.trim() || null,
                  model: [manual.model.trim(), manual.trim.trim()].filter(Boolean).join(" ") || null,
                  engineCapacityCc: manual.engineCc ? Math.round(Number(manual.engineCc)) : null,
                  fuel: manual.fuel,
                  bodyType: manual.bodyType || null,
                  crspKes: Number(manual.cif),
                  valuationSource: "manual_cif" as const,
                  cifKes: Number(manual.cif),
                  categoryOverride: categoryOverride === "auto" ? null : (categoryOverride as CategoryCode),
                  recordType: "vehicle" as const,
                }
              : {
                  id: record!.id,
                  make: record!.make,
                  model: record!.model,
                  engineCapacityCc: record!.engineCapacityCc,
                  fuel: record!.fuel,
                  bodyType: record!.bodyType,
                  crspKes: record!.crspKes!,
                  valuationSource: "crsp" as const,
                  categoryOverride: categoryOverride === "auto" ? null : (categoryOverride as CategoryCode),
                  recordType: record!.recordType,
                },
          firstRegistrationYear:
            mode === "manual" && manual.regYear ? Number(manual.regYear) : null,
          importType,
          yearOfManufacture: Number(year),
          importDate: new Date().toISOString().slice(0, 10),
          currency: currency.toUpperCase(),
          purchasePrice: purchasePrice ? Number(purchasePrice) : null,
          freight: freight ? Number(freight) : null,
          insurance: insurance ? Number(insurance) : null,
          otherCosts: otherCosts ? Number(otherCosts) : null,
          exchangeRateOverride: rateValue > 0 ? rateValue : null,
        },
      }),
  });

  return (
    <main className="mx-auto max-w-5xl overflow-x-hidden px-3 pb-16 sm:px-4 sm:pb-20">
      {/* Floating navigation */}
      <nav className="sticky top-3 z-40 mb-8 flex justify-center px-1 sm:top-4">
        <div className="glass-float flex w-full max-w-3xl items-center justify-between gap-3 rounded-2xl border border-border py-2.5 pl-3 pr-2.5">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_4px_16px_rgba(36,91,255,0.4)]">
              <Car className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-semibold leading-tight">
                Fast Imports Kenya
              </span>
              <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                Import tax &amp; duty calculator
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/rules"
              className="glass-chip hidden rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-white/10 sm:inline-block"
            >
              Rules &amp; depreciation
            </Link>
            <Link
              to="/rules"
              className="glass-chip inline-block rounded-full border border-border p-2 text-foreground transition-colors hover:bg-white/10 sm:hidden"
              aria-label="Tax rules and depreciation"
            >
              <Landmark className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <header className="mb-10">
        <span className="glass-chip inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-acid" />
          CRSP July 2025 schedule · applied as the 2026 workbook
        </span>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          Kenya vehicle import tax &amp;{" "}
          <span className="text-primary">duty calculator</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Pick the exact unit from the official Current Retail Selling Price schedule, then see duty, excise, VAT, the
          Railway Development Levy and the Import Declaration Fee computed step by step from the published tabulations.
        </p>
        <Link to="/rules" className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
          View the tax rules and depreciation schedules →
        </Link>
      </header>

      <div className="space-y-6">
        <Card>
          <StepHeading step="01" title="Find the unit" icon={<Car className="h-4 w-4 text-primary" />} />
          <CardContent className="px-3 sm:px-6">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Vehicle source</p>
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Vehicle source">
              {[
                { v: "crsp" as const, t: "CRSP Listed Vehicle", d: "Option 1: use a CRSP record" },
                { v: "manual" as const, t: "Vehicle Not Listed in CRSP", d: "Option 2: enter vehicle details manually" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={mode === o.v}
                  onClick={() => {
                    setMode(o.v);
                    calc.reset();
                    setManualErrors([]);
                  }}
                  className={`rounded-xl border p-4 text-left transition-all duration-200 ${
                    mode === o.v
                      ? "glow-cobalt border-primary/70 bg-primary/10"
                      : "glass-chip border-border hover:border-primary/50 hover:bg-white/[0.07]"
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <span
                      className={`h-2 w-2 rounded-full ${mode === o.v ? "bg-acid" : "bg-white/20"}`}
                    />
                    {o.t}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{o.d}</span>
                </button>
              ))}
            </div>
            {mode === "manual" ? (
              <ManualVehicleForm values={manual} set={setM} year={year} setYear={setYear} />
            ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-4 h-auto w-full flex-wrap sm:w-auto">
                <TabsTrigger value="vehicle">Motor vehicles</TabsTrigger>
                <TabsTrigger value="other">Motorcycles &amp; machinery</TabsTrigger>
              </TabsList>
              <TabsContent value="vehicle">
                <CrspVehicleSearch
                  onSelect={(r) => {
                    setRecord(r);
                    calc.reset();
                  }}
                />
              </TabsContent>
              <TabsContent value="other">
                <VehicleSearch
                  onSelect={(r) => {
                    setRecord(r);
                    calc.reset();
                  }}
                />
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>

        {(mode === "manual" || record) && (
          <Card>
            <StepHeading
              step="02"
              title={mode === "manual" ? "Import details" : `${record!.make ?? ""} ${record!.model ?? ""}`.trim()}
              icon={<Landmark className="h-4 w-4 text-primary" />}
            />
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Import type</Label>
                  <Select value={importType} onValueChange={(v) => setImportType(v as ImportType)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct import (new / unregistered)</SelectItem>
                      <SelectItem value="previously_registered">Previously registered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {mode === "crsp" && (
                  <div>
                    <Label htmlFor="yom">Year of manufacture</Label>
                    <Input id="yom" className="h-11" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
                  </div>
                )}
                <div>
                  <Label>Category</Label>
                  <Select value={categoryOverride} onValueChange={setCategoryOverride}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Detect automatically</SelectItem>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="glass-chip rounded-xl border border-border p-4">
                <p className="mb-3 text-sm font-medium text-muted-foreground">Purchase price &amp; currency</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label>Purchase currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pp">Purchase price ({currency})</Label>
                    <Input id="pp" className="h-11" inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
                  </div>
                  {currency !== "KES" && (
                    <div>
                      <Label htmlFor="fx">{currency} → KES rate</Label>
                      <Input
                        id="fx"
                        className="h-11"
                        inputMode="decimal"
                        value={rates[currency] ?? ""}
                        onChange={(e) => setRates((r) => ({ ...r, [currency]: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
                {currency !== "KES" && (
                  <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="text-muted-foreground">KES equivalent:</span>
                    <span className="font-semibold text-acid tabular-nums">
                      {kesEquivalent != null
                        ? `KES ${kesEquivalent.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`
                        : "—"}
                    </span>
                    {rateValue > 0 && (
                      <span className="text-muted-foreground tabular-nums">(rate {rateValue.toFixed(2)})</span>
                    )}
                  </p>
                )}
                {currency !== "KES" && rateValue <= 0 && (
                  <p className="mt-1 text-sm text-destructive">Enter a {currency} → KES rate to convert.</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="fr">Freight</Label>
                  <Input id="fr" className="h-11" inputMode="decimal" value={freight} onChange={(e) => setFreight(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="ins">Insurance</Label>
                  <Input id="ins" className="h-11" inputMode="decimal" value={insurance} onChange={(e) => setInsurance(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="oth">Other costs</Label>
                  <Input id="oth" className="h-11" inputMode="decimal" value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} />
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="h-12 w-full text-base sm:w-auto sm:px-8"
                  onClick={() => {
                    if (mode === "manual") {
                      const errs = validateManual();
                      setManualErrors(errs);
                      if (errs.length) return;
                    }
                    calc.mutate();
                  }}
                  disabled={calc.isPending}
                >
                  {calc.isPending ? "Calculating…" : "Calculate taxes"}
                </Button>
                {manualErrors.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-destructive" role="alert">
                    {manualErrors.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                )}
                {calc.isError && (
                  <p className="text-sm text-destructive">{(calc.error as Error).message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {calc.data && (
          <section aria-label="Results">
            <Card>
              <StepHeading step="03" title="Breakdown" icon={<ListChecks className="h-4 w-4 text-primary" />} />
              <CardContent className="space-y-6">
                <ClearingCosts values={clearing} onChange={setClearing} />
                <ResultsBreakdown
                  result={calc.data.result as CalculationResult}
                  meta={calc.data.meta}
                  clearingTotal={clearingTotal(clearing)}
                />
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  );
}

const FUELS = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC"];
const TRANSMISSIONS = ["Automatic", "Manual", "CVT", "AMT", "DCT", "Other"];
const DRIVES = ["2WD", "4WD", "AWD", "FWD", "RWD", "Other"];
const BODIES = ["Saloon", "Hatchback", "Station Wagon", "SUV", "Pickup", "Double Cab", "Van", "Bus", "Truck", "Other"];

function ManualVehicleForm({
  values,
  set,
  year,
  setYear,
}: {
  values: Record<string, string>;
  set: (k: never) => (v: string) => void;
  year: string;
  setYear: (v: string) => void;
}) {
  const s = set as unknown as (k: string) => (v: string) => void;
  const text = (k: string, label: string, ph: string, numeric = false) => (
    <div>
      <Label htmlFor={`m-${k}`}>{label}</Label>
      <Input
        id={`m-${k}`}
        className="h-11"
        placeholder={ph}
        inputMode={numeric ? "numeric" : undefined}
        value={values[k] ?? ""}
        onChange={(e) => s(k)(numeric ? e.target.value.replace(/[^0-9.]/g, "") : e.target.value)}
      />
    </div>
  );
  const pick = (k: string, label: string, opts: string[]) => (
    <div>
      <Label>{label}</Label>
      <Select value={values[k] ?? ""} onValueChange={s(k)}>
        <SelectTrigger className="h-11" aria-label={label}>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {opts.map((o) => (
            <SelectItem key={o} value={o}>
              {o.length > 3 && o === o.toUpperCase() ? o.charAt(0) + o.slice(1).toLowerCase() : o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the vehicle's current value (KES). It is treated as the CRSP: the workbook depreciation schedule (from
        the manufacturing year) and the category divisor chain are applied before the taxes, exactly as for a listed
        vehicle.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {text("make", "Make (optional)", "Enter make")}
        {text("model", "Model (optional)", "Enter model")}
        {text("trim", "Trim (optional)", "Enter trim")}
        <div>
          <Label htmlFor="m-yom">Manufacturing year</Label>
          <Input id="m-yom" className="h-11" inputMode="numeric" placeholder="YYYY" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
        {text("regYear", "Registration year (if previously registered)", "YYYY", true)}
        {text("cif", "Vehicle value / CRSP (KES)", "e.g. 8500000", true)}
        {text("engineCc", "Engine capacity (cc)", "e.g. 2000", true)}
        {pick("fuel", "Fuel type", FUELS)}
        {pick("transmission", "Transmission", TRANSMISSIONS)}
        {pick("drive", "Drive configuration", DRIVES)}
        {pick("bodyType", "Vehicle type (optional)", BODIES)}
      </div>
    </div>
  );
}
