import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { VehicleSearch, type SelectedRecord } from "@/components/VehicleSearch";
import { ResultsBreakdown } from "@/components/ResultsBreakdown";
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

function Index() {
  const [record, setRecord] = useState<SelectedRecord | null>(null);
  const [importType, setImportType] = useState<ImportType>("direct");
  const [year, setYear] = useState(String(new Date().getFullYear() - 5));
  const [categoryOverride, setCategoryOverride] = useState<string>("auto");
  const [currency, setCurrency] = useState("KES");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [freight, setFreight] = useState("");
  const [insurance, setInsurance] = useState("");
  const [otherCosts, setOtherCosts] = useState("");

  const run = useServerFn(calculateTaxes);
  const calc = useMutation({
    mutationFn: () =>
      run({
        data: {
          vehicle: {
            id: record!.id,
            make: record!.make,
            model: record!.model,
            engineCapacityCc: record!.engineCapacityCc,
            fuel: record!.fuel,
            bodyType: record!.bodyType,
            crspKes: record!.crspKes!,
            categoryOverride: categoryOverride === "auto" ? null : (categoryOverride as CategoryCode),
            recordType: record!.recordType,
          },
          importType,
          yearOfManufacture: Number(year),
          importDate: new Date().toISOString().slice(0, 10),
          currency: currency.toUpperCase(),
          purchasePrice: purchasePrice ? Number(purchasePrice) : null,
          freight: freight ? Number(freight) : null,
          insurance: insurance ? Number(insurance) : null,
          otherCosts: otherCosts ? Number(otherCosts) : null,
        },
      }),
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">CRSP July 2025 schedule</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          Kenya vehicle import tax &amp; duty calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pick the exact unit from the official Current Retail Selling Price schedule, then see duty, excise, VAT, the
          Railway Development Levy and the Import Declaration Fee computed step by step from the published tabulations.
        </p>
        <Link to="/rules" className="mt-3 inline-block text-sm font-medium text-primary underline">
          View the tax rules and depreciation schedules
        </Link>
      </header>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">1. Find the unit</CardTitle>
        </CardHeader>
        <CardContent>
          <VehicleSearch
            onSelect={(r) => {
              setRecord(r);
              calc.reset();
            }}
          />
        </CardContent>
      </Card>

      {record && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              2. {record.make} {record.model}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Import type</Label>
                <Select value={importType} onValueChange={(v) => setImportType(v as ImportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct import (new / unregistered)</SelectItem>
                    <SelectItem value="previously_registered">Previously registered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="yom">Year of manufacture</Label>
                <Input id="yom" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={categoryOverride} onValueChange={setCategoryOverride}>
                  <SelectTrigger>
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

            <div className="grid gap-4 sm:grid-cols-5">
              <div>
                <Label htmlFor="cur">Currency</Label>
                <Input id="cur" value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pp">Purchase price</Label>
                <Input id="pp" inputMode="decimal" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="fr">Freight</Label>
                <Input id="fr" inputMode="decimal" value={freight} onChange={(e) => setFreight(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="ins">Insurance</Label>
                <Input id="ins" inputMode="decimal" value={insurance} onChange={(e) => setInsurance(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="oth">Other costs</Label>
                <Input id="oth" inputMode="decimal" value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} />
              </div>
            </div>

            <Button onClick={() => calc.mutate()} disabled={calc.isPending}>
              {calc.isPending ? "Calculating…" : "Calculate taxes"}
            </Button>
            {calc.isError && (
              <p className="text-sm text-destructive">{(calc.error as Error).message}</p>
            )}
          </CardContent>
        </Card>
      )}

      {calc.data && (
        <section aria-label="Results">
          <h2 className="mb-4 text-xl font-semibold">3. Breakdown</h2>
          <ResultsBreakdown result={calc.data.result as CalculationResult} meta={calc.data.meta} />
        </section>
      )}
    </main>
  );
}
