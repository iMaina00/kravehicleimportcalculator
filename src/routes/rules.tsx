import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getRuleReference } from "@/lib/calculator.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const rulesQuery = queryOptions({
  queryKey: ["rule-reference"],
  queryFn: () => getRuleReference(),
});

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Tax rules & depreciation schedules | Kenya Import Calculator" },
      {
        name: "description",
        content:
          "Every import duty, excise, VAT, RDL and IDF rate used by the calculator, plus the direct-import and previously-registered depreciation schedules, with their source references.",
      },
      { property: "og:title", content: "Tax rules & depreciation schedules" },
      {
        property: "og:description",
        content: "The exact rates, formulas and depreciation bands behind every Kenyan vehicle import estimate.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(rulesQuery),
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-xl font-semibold">The rule reference didn't load</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </main>
  ),
  component: RulesPage,
});

function RulesPage() {
  const { data } = useSuspenseQuery(rulesQuery);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/" className="text-sm text-primary underline">
        Back to the calculator
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Tax rules &amp; depreciation</h1>
      <p className="mt-2 text-muted-foreground">
        Active CRSP schedule: {data.datasetName ?? "—"} · rule version: {data.taxRuleVersionName ?? "—"}
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Depreciation schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Import type</TableHead>
                <TableHead>Age band</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.depreciationRules.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.import_type === "direct" ? "Direct import" : "Previously registered"}</TableCell>
                  <TableCell>{d.label}</TableCell>
                  <TableCell>{(Number(d.rate) * 100).toFixed(0)}%</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.source ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Tax rules by category</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Import type</TableHead>
                <TableHead>Charge</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Formula</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.taxRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.category_code}</TableCell>
                  <TableCell className="text-xs">{r.import_type}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    {r.rate === null
                      ? r.fixed_amount === null
                        ? "—"
                        : `KES ${Number(r.fixed_amount).toLocaleString()}`
                      : `${(Number(r.rate) * 100).toFixed(2)}%`}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-muted-foreground">{r.formula}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {r.verification_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data.exchangeRates.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-base">Exchange rates</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm">
              {data.exchangeRates.map((x) => (
                <li key={x.currency}>
                  1 {x.currency} = {Number(x.rate_to_kes).toLocaleString()} KES
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
