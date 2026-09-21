import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppData, updateCollectionNotes, voidCollection } from "@/services/store";
import { financialTotals, householdSummaries } from "@/services/selectors";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { downloadCSV } from "@/services/pdf";
import {
  EmptyState,
  MethodBadge,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components/app/ui-bits";
import { PautiActions } from "@/components/app/CollectDialog";

type Search = { q?: string | undefined; method?: string | undefined; wing?: string | undefined; collector?: string | undefined; from?: string | undefined; to?: string | undefined; status?: string | undefined };

export const Route = createFileRoute("/collections")({
  validateSearch: (s: Record<string, unknown>): Search =>
    Object.fromEntries(
      ["q", "method", "wing", "collector", "from", "to", "status"].map((k) => [
        k,
        typeof s[k] === "string" ? (s[k] as string) : undefined,
      ]),
    ),
  head: () => ({
    meta: [
      { title: "Collections Ledger — Digital Vargani" },
      {
        name: "description",
        content: "Full Vargani collection ledger with filters by wing, collector, payment method and date.",
      },
      { property: "og:title", content: "Collections Ledger — Digital Vargani" },
      { property: "og:description", content: "Every Vargani transaction with Pauti number and collector." },
    ],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const data = useAppData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const totals = useMemo(() => financialTotals(data), [data]);
  const summaries = useMemo(() => householdSummaries(data), [data]);
  const hh = new Map(summaries.map((s) => [s.household.id, s]));
  const collectorName = (id: string) => data.collectors.find((c) => c.id === id)?.name ?? "—";
  const [voidId, setVoidId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const setSearch = (patch: Search) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const q = (search.q ?? "").trim().toLowerCase();
  const rows = data.collections
    .filter((c) => {
      const h = hh.get(c.householdId);
      if (search.status === "VOID" ? !c.voided : search.status === "ACTIVE" ? c.voided : false) return false;
      if (q && ![c.pautiNo, h?.household.flatNo ?? "", h?.household.residentName ?? ""].some((v) => v.toLowerCase().includes(q)))
        return false;
      if (search.method && search.method !== "ALL" && c.method !== search.method) return false;
      if (search.wing && search.wing !== "ALL" && h?.household.wingId !== search.wing) return false;
      if (search.collector && search.collector !== "ALL" && c.collectorId !== search.collector) return false;
      if (search.from && c.date < search.from) return false;
      if (search.to && c.date > `${search.to}T23:59:59`) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredTotal = rows.filter((r) => !r.voided).reduce((s, r) => s + r.amount, 0);

  const exportCsv = () =>
    downloadCSV(`collections-${data.mandal.year}.csv`, [
      ["Pauti No", "Date", "Flat", "Resident", "Amount", "Method", "Collector", "Status"],
      ...rows.map((c) => {
        const h = hh.get(c.householdId);
        return [
          c.pautiNo,
          formatDate(c.date),
          h?.household.flatNo ?? "",
          h?.household.residentName ?? "",
          c.amount,
          c.method,
          collectorName(c.collectorId),
          c.voided ? "VOID" : "ACTIVE",
        ];
      }),
    ]);

  return (
    <>
      <PageHeader
        title="Collections"
        marathi="जमा"
        description={`${formatNumber(rows.length)} transactions · ${formatINR(filteredTotal)} in current view`}
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Collection" value={formatINR(totals.totalCollection)} tone="primary" />
        <StatCard label="UPI" value={formatINR(totals.byMethod.UPI)} tone="upi" />
        <StatCard label="Cash" value={formatINR(totals.byMethod.CASH)} tone="cash" />
        <StatCard
          label="Bank / Cheque"
          value={formatINR(totals.byMethod.BANK + totals.byMethod.CHEQUE)}
          tone="bank"
        />
        <StatCard label="Transactions" value={formatNumber(totals.transactions)} />
        <StatCard label="Households Paid" value={formatNumber(totals.paidCount)} sub={`${totals.partialCount} partial`} />
        <StatCard label="Pending Amount" value={formatINR(totals.pendingAmount)} tone="danger" />
        <StatCard label="Collection %" value={`${totals.collectionPercent}%`} tone="success" />
      </div>

      <SectionCard title="Filters" className="my-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Pauti no., flat, resident"
              value={search.q ?? ""}
              onChange={(e) => setSearch({ q: e.target.value || undefined })}
            />
          </div>
          <Select value={search.method ?? "ALL"} onValueChange={(v) => setSearch({ method: v })}>
            <SelectTrigger><SelectValue placeholder="Payment method" /></SelectTrigger>
            <SelectContent>
              {["ALL", "UPI", "CASH", "BANK", "CHEQUE"].map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={search.wing ?? "ALL"} onValueChange={(v) => setSearch({ wing: v })}>
            <SelectTrigger><SelectValue placeholder="Wing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All wings</SelectItem>
              {data.wings.map((w) => (
                <SelectItem key={w.id} value={w.id}>Wing {w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={search.collector ?? "ALL"} onValueChange={(v) => setSearch({ collector: v })}>
            <SelectTrigger><SelectValue placeholder="Collector" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All collectors</SelectItem>
              {data.collectors.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={search.from ?? ""} onChange={(e) => setSearch({ from: e.target.value || undefined })} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={search.to ?? ""} onChange={(e) => setSearch({ to: e.target.value || undefined })} />
          </div>
          <Select value={search.status ?? "ALL"} onValueChange={(v) => setSearch({ status: v })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All records</SelectItem>
              <SelectItem value="ACTIVE">Active only</SelectItem>
              <SelectItem value="VOID">Voided only</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="self-end" onClick={() => navigate({ search: {}, replace: true })}>
            Clear filters
          </Button>
        </div>
      </SectionCard>

      {rows.length === 0 ? (
        <EmptyState
          title="No collections match these filters"
          description="Adjust the filters, or record a new Vargani collection from a household."
          action={<Button asChild><Link to="/households">Go to households</Link></Button>}
        />
      ) : (
        <>
          <div className="space-y-2 lg:hidden">
            {rows.slice(0, 100).map((c) => {
              const h = hh.get(c.householdId);
              return (
                <div key={c.id} className="rounded-xl border bg-card p-3 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{h?.household.flatNo}</p>
                      <p className="text-xs text-muted-foreground">{c.pautiNo} · {formatDate(c.date)}</p>
                    </div>
                    <span className="num font-bold">{formatINR(c.amount)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <MethodBadge method={c.method} />
                    {c.voided ? <StatusBadge status="VOID" /> : null}
                    <span className="text-xs text-muted-foreground">{collectorName(c.collectorId)}</span>
                  </div>
                  <div className="mt-2"><PautiActions collection={c} /></div>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-card lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs tracking-wide uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Pauti No.</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Flat</th>
                  <th className="px-4 py-3">Resident</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Collector</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 150).map((c) => {
                  const h = hh.get(c.householdId);
                  return (
                    <tr key={c.id} className="border-t hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-medium">{c.pautiNo}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{formatDate(c.date)}</td>
                      <td className="px-4 py-2.5">
                        {h ? (
                          <Link to="/households/$id" params={{ id: h.household.id }} className="font-semibold hover:text-primary">
                            {h.household.flatNo}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-2.5">{h?.household.residentName}</td>
                      <td className="num px-4 py-2.5 text-right font-semibold">{formatINR(c.amount)}</td>
                      <td className="px-4 py-2.5"><MethodBadge method={c.method} /></td>
                      <td className="px-4 py-2.5 text-muted-foreground">{collectorName(c.collectorId)}</td>
                      <td className="px-4 py-2.5">
                        {c.voided ? <StatusBadge status="VOID" /> : <StatusBadge status="PAID" />}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-2">
                          <PautiActions collection={c} />
                          <Button size="sm" variant="ghost" onClick={() => setEditId(c.id)}>Edit</Button>
                          {!c.voided ? (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setVoidId(c.id)}>
                              Void
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > 150 ? (
              <p className="border-t px-4 py-3 text-xs text-muted-foreground">
                Showing the 150 most recent of {rows.length} transactions.
              </p>
            ) : null}
          </div>
        </>
      )}

      <VoidDialog id={voidId} onClose={() => setVoidId(null)} />
      <EditNotesDialog id={editId} onClose={() => setEditId(null)} />
    </>
  );
}

function VoidDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <AlertDialog open={id !== null} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Void this collection?</AlertDialogTitle>
          <AlertDialogDescription>
            Financial records are never deleted. Voiding keeps the transaction and its Pauti number in
            history, but removes the amount from all totals.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (!reason.trim()) {
                toast.error("Please enter a reason for voiding this record.");
                return;
              }
              voidCollection(id!, reason.trim());
              setReason("");
              toast.success("Collection voided");
              onClose();
            }}
          >
            Void collection
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EditNotesDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const data = useAppData();
  const collection = data.collections.find((c) => c.id === id);
  const [notes, setNotes] = useState("");
  return (
    <Dialog
      open={id !== null}
      onOpenChange={(v) => {
        if (!v) onClose();
        else setNotes(collection?.notes ?? "");
      }}
    >
      <DialogContent>
        <DialogHeader><DialogTitle>Edit note — {collection?.pautiNo}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          Amounts cannot be edited. To correct an amount, void this record and record a new collection.
        </p>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="UPI reference, remarks…"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              updateCollectionNotes(id!, notes);
              toast.success("Note updated");
              onClose();
            }}
          >
            Save note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
