import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Banknote, Building2, IndianRupee, Landmark, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/services/store";
import {
  activeCollections,
  activeExpenses,
  financialTotals,
  householdSummaries,
  visibleHouseholds,
} from "@/services/selectors";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import {
  EmptyState,
  MethodBadge,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components/app/ui-bits";
import { CollectDialog } from "@/components/app/CollectDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Digital Vargani | Ganpati Mandal" },
      {
        name: "description",
        content:
          "Live Ganpati Mandal dashboard: total Vargani collection, UPI/cash/bank split, expenses, balance and pending households.",
      },
      { property: "og:title", content: "Digital Vargani — Ganpati Mandal Dashboard" },
      {
        property: "og:description",
        content: "Collect Vargani, generate Pauti and track the complete Ganeshotsav Hishob.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useAppData();
  const totals = useMemo(() => financialTotals(data), [data]);
  const summaries = useMemo(() => householdSummaries(data), [data]);
  const scoped = useMemo(() => visibleHouseholds(data, summaries), [data, summaries]);
  const [collectFor, setCollectFor] = useState<string | null>(null);

  const collectorNames = new Map(data.collectors.map((c) => [c.id, c.name]));
  const flatById = new Map(summaries.map((s) => [s.household.id, s.household]));

  const recentCollections = [...activeCollections(data)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  const recentExpenses = [...activeExpenses(data)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const pending = scoped
    .filter((s) => s.status === "PENDING" || s.status === "PARTIAL")
    .sort((a, b) => b.remaining - a.remaining)
    .slice(0, 6);

  const methodRows = (["UPI", "CASH", "BANK", "CHEQUE"] as const).map((m) => ({
    method: m,
    amount: totals.byMethod[m],
    percent: totals.totalCollection ? (totals.byMethod[m] / totals.totalCollection) * 100 : 0,
  }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        marathi="डॅशबोर्ड"
        description={`Ganeshotsav ${data.mandal.year} · Collect → Pauti → Hishob`}
        actions={
          <Button asChild>
            <Link to="/households">
              <IndianRupee className="h-4 w-4" /> Collect Vargani
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Collection"
          marathi="एकूण जमा"
          value={formatINR(totals.totalCollection)}
          sub={`${formatNumber(totals.transactions)} transactions`}
          tone="primary"
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatCard
          label="UPI"
          value={formatINR(totals.byMethod.UPI)}
          tone="upi"
          icon={<Smartphone className="h-5 w-5" />}
        />
        <StatCard
          label="Cash"
          value={formatINR(totals.byMethod.CASH)}
          tone="cash"
          icon={<Banknote className="h-5 w-5" />}
        />
        <StatCard
          label="Bank + Cheque"
          value={formatINR(totals.byMethod.BANK + totals.byMethod.CHEQUE)}
          sub={`Bank ${formatINR(totals.byMethod.BANK)} · Cheque ${formatINR(totals.byMethod.CHEQUE)}`}
          tone="bank"
          icon={<Landmark className="h-5 w-5" />}
        />
        <StatCard
          label="Total Expenses"
          marathi="एकूण खर्च"
          value={formatINR(totals.totalExpenses)}
          tone="secondary"
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="Current Balance"
          marathi="शिल्लक"
          value={formatINR(totals.balance)}
          sub={`Income ${formatINR(totals.totalIncome)}`}
          tone="success"
        />
        <StatCard
          label="Households"
          value={`${formatNumber(totals.paidCount)} / ${formatNumber(totals.totalHouseholds)}`}
          sub={`${totals.partialCount} partial · ${totals.exemptCount} exempt`}
          tone="plain"
          icon={<Building2 className="h-5 w-5 text-primary" />}
        />
        <StatCard
          label="Pending"
          marathi="बाकी"
          value={`${formatNumber(totals.pendingCount)}`}
          sub={`${formatINR(totals.pendingAmount)} to collect`}
          tone="danger"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Collection Progress">
          <div className="flex items-end justify-between">
            <div>
              <p className="num text-3xl font-bold">
                {formatNumber(totals.paidCount)}
                <span className="text-lg text-muted-foreground">
                  {" "}
                  / {formatNumber(totals.totalHouseholds)}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">households fully paid</p>
            </div>
            <p className="num text-2xl font-bold text-primary">{totals.collectionPercent}%</p>
          </div>
          <div className="mt-4">
            <ProgressBar percent={totals.collectionPercent} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Mini label="Expected" value={formatINR(totals.expectedTotal)} />
            <Mini label="Collected" value={formatINR(totals.totalCollection)} />
            <Mini label="Pending" value={formatINR(totals.pendingAmount)} />
          </div>
        </SectionCard>

        <SectionCard title="Payment Breakdown">
          <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {methodRows.map((r) => (
              <div
                key={r.method}
                className={
                  r.method === "UPI"
                    ? "bg-upi"
                    : r.method === "CASH"
                      ? "bg-cash"
                      : r.method === "BANK"
                        ? "bg-bank"
                        : "bg-cheque"
                }
                style={{ width: `${r.percent}%` }}
              />
            ))}
          </div>
          <ul className="space-y-2">
            {methodRows.map((r) => (
              <li key={r.method} className="flex items-center justify-between text-sm">
                <MethodBadge method={r.method} />
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground">{Math.round(r.percent)}%</span>
                  <span className="num font-semibold">{formatINR(r.amount)}</span>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <SectionCard
          title="Recent Collections"
          className="xl:col-span-2"
          action={
            <Link to="/collections" className="text-xs font-semibold text-primary">
              View all
            </Link>
          }
        >
          {recentCollections.length === 0 ? (
            <EmptyState
              title="No collections yet"
              description="Record your first Vargani collection to see it here."
            />
          ) : (
            <div className="space-y-2">
              {recentCollections.map((c) => {
                const hh = flatById.get(c.householdId);
                return (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {hh?.flatNo ?? "—"}{" "}
                        <span className="text-xs font-normal text-muted-foreground">{c.pautiNo}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {hh?.residentName} · {collectorNames.get(c.collectorId)} · {formatDate(c.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <MethodBadge method={c.method} />
                      <span className="num font-bold">{formatINR(c.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Expenses"
          action={
            <Link to="/expenses" className="text-xs font-semibold text-primary">
              View all
            </Link>
          }
        >
          {recentExpenses.length === 0 ? (
            <EmptyState title="No expenses recorded yet" description="Add your first expense." />
          ) : (
            <ul className="space-y-2">
              {recentExpenses.map((e) => (
                <li key={e.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{e.category}</p>
                    <span className="num text-sm font-bold">{formatINR(e.amount)}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {e.description} · {formatDate(e.date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title="Pending Vargani"
          action={
            <Link to="/households" search={{ status: "PENDING" }} className="text-xs font-semibold text-primary">
              View all
            </Link>
          }
        >
          {pending.length === 0 ? (
            <EmptyState
              title="Everything collected"
              description="No pending households right now. Ganpati Bappa Morya!"
            />
          ) : (
            <div className="space-y-2">
              {pending.map((s) => (
                <div
                  key={s.household.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="min-w-0">
                    <Link
                      to="/households/$id"
                      params={{ id: s.household.id }}
                      className="font-semibold hover:text-primary"
                    >
                      {s.household.flatNo}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.household.residentName} · Expected {formatINR(s.household.expectedAmount)} ·
                      Paid {formatINR(s.paid)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={s.status} />
                    <span className="num font-bold text-destructive">{formatINR(s.remaining)}</span>
                    <Button size="sm" onClick={() => setCollectFor(s.household.id)}>
                      Collect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <CollectDialog
        householdId={collectFor}
        open={collectFor !== null}
        onOpenChange={(v) => !v && setCollectFor(null)}
      />
    </>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <p className="text-[10px] tracking-wider uppercase text-muted-foreground">{label}</p>
      <p className="num text-sm font-bold">{value}</p>
    </div>
  );
}
