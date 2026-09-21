import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Receipt, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useAppData } from "@/services/store";
import { householdSummaries } from "@/services/selectors";
import { amountInWords, formatDate, formatINR } from "@/lib/format";
import { EmptyState, MethodBadge, PageHeader, StatusBadge } from "@/components/app/ui-bits";
import { PautiActions } from "@/components/app/CollectDialog";

type Search = { q?: string | undefined };

export const Route = createFileRoute("/pautis")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s["q"] === "string" ? (s["q"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pautis / Receipts — Digital Vargani" },
      {
        name: "description",
        content: "Every Vargani Pauti with unique receipt number, PDF download, print and WhatsApp share.",
      },
      { property: "og:title", content: "Pautis / Receipts — Digital Vargani" },
      { property: "og:description", content: "Professional Ganpati Mandal receipts, ready to print or share." },
    ],
  }),
  component: PautisPage,
});

function PautisPage() {
  const data = useAppData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const summaries = useMemo(() => householdSummaries(data), [data]);
  const hh = new Map(summaries.map((s) => [s.household.id, s.household]));

  const q = (search.q ?? "").trim().toLowerCase();
  const rows = data.collections
    .filter((c) => {
      if (!q) return true;
      const h = hh.get(c.householdId);
      return [c.pautiNo, h?.flatNo ?? "", h?.residentName ?? ""].some((v) => v.toLowerCase().includes(q));
    })
    .sort((a, b) => b.pautiNo.localeCompare(a.pautiNo));

  return (
    <>
      <PageHeader
        title="Pautis"
        marathi="पावती"
        description={`${rows.length} receipts issued for Ganeshotsav ${data.mandal.year}`}
      />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search Pauti no., flat or resident"
          value={search.q ?? ""}
          onChange={(e) =>
            navigate({ search: { q: e.target.value || undefined }, replace: true })
          }
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-8 w-8" />}
          title="No Pautis yet"
          description="Every recorded Vargani collection automatically generates a unique Pauti."
          action={<Button asChild><Link to="/households">Collect Vargani</Link></Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.slice(0, 60).map((c) => {
            const h = hh.get(c.householdId);
            return (
              <article key={c.id} className="overflow-hidden rounded-2xl border bg-card shadow-card">
                <header className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
                  <div>
                    <p className="text-xs opacity-85">Pauti No.</p>
                    <p className="font-bold">{c.pautiNo}</p>
                  </div>
                  <p className="text-xs">{formatDate(c.date)}</p>
                </header>
                <div className="space-y-1.5 px-4 py-3 text-sm">
                  <p className="font-semibold">
                    {h?.flatNo} · {h?.residentName}
                  </p>
                  <p className="num text-2xl font-bold">{formatINR(c.amount)}</p>
                  <p className="text-xs text-muted-foreground">{amountInWords(c.amount)}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <MethodBadge method={c.method} />
                    {c.voided ? <StatusBadge status="VOID" /> : null}
                    <span className="text-xs text-muted-foreground">
                      {data.collectors.find((x) => x.id === c.collectorId)?.name}
                    </span>
                  </div>
                </div>
                <footer className="border-t px-4 py-3">
                  <PautiActions collection={c} />
                </footer>
              </article>
            );
          })}
        </div>
      )}
      {rows.length > 60 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing the 60 most recent Pautis — search to find older receipts.
        </p>
      ) : null}
    </>
  );
}
