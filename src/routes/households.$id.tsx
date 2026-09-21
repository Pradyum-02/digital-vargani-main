import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, Pencil, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateHousehold, useAppData } from "@/services/store";
import { summaryFor } from "@/services/selectors";
import { formatDate, formatINR } from "@/lib/format";
import {
  EmptyState,
  MethodBadge,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components/app/ui-bits";
import { CollectDialog, PautiActions } from "@/components/app/CollectDialog";
import { reminderText, whatsAppService } from "@/services/whatsapp";

export const Route = createFileRoute("/households/$id")({
  head: () => ({
    meta: [
      { title: "Household details — Digital Vargani" },
      {
        name: "description",
        content:
          "Household Vargani details: expected amount, paid, remaining, Pauti history and collector history.",
      },
      { property: "og:title", content: "Household details — Digital Vargani" },
      {
        property: "og:description",
        content: "Collect Vargani, view Pauti history and send reminders for a household.",
      },
    ],
  }),
  component: HouseholdDetail,
});

function HouseholdDetail() {
  const { id } = Route.useParams();
  const data = useAppData();
  const navigate = useNavigate();
  const summary = useMemo(() => summaryFor(data, id), [data, id]);
  const [collectOpen, setCollectOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (!summary) {
    return (
      <EmptyState
        title="Household not found"
        description="This household may have been archived."
        action={
          <Button onClick={() => navigate({ to: "/households" })}>Back to households</Button>
        }
      />
    );
  }

  const { household } = summary;
  const collectorName = (cid: string) => data.collectors.find((c) => c.id === cid)?.name ?? "—";

  const sendReminder = async () => {
    const result = await whatsAppService.sendReminder({
      to: household.mobile,
      text: reminderText({
        year: data.mandal.year,
        flatNo: household.flatNo,
        remaining: summary.remaining,
        mandalName: data.mandal.name,
      }),
    });
    toast(result.ok ? "Reminder ready" : "Could not open WhatsApp", { description: result.detail });
  };

  return (
    <>
      <Link to="/households" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> All households
      </Link>

      <PageHeader
        title={household.flatNo}
        description={`${summary.buildingName} · Wing ${summary.wingName} · Floor ${household.floor}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="outline" onClick={sendReminder} disabled={summary.remaining === 0}>
              <MessageCircle className="h-4 w-4" /> Send reminder
            </Button>
            <Button onClick={() => setCollectOpen(true)} disabled={summary.status === "EXEMPT"}>
              Collect Vargani
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Expected" marathi="अपेक्षित" value={formatINR(household.expectedAmount)} tone="secondary" />
        <StatCard label="Paid" marathi="जमा" value={formatINR(summary.paid)} tone="success" />
        <StatCard label="Remaining" marathi="बाकी" value={formatINR(summary.remaining)} tone={summary.remaining ? "danger" : "plain"} />
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Status</p>
          <div className="mt-3"><StatusBadge status={summary.status} /></div>
          <p className="mt-3 text-sm text-muted-foreground">Collector: {summary.collectorName}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Resident">
          <dl className="space-y-2 text-sm">
            <Item label="Name" value={household.residentName} />
            <Item
              label="Mobile"
              value={
                <a className="inline-flex items-center gap-1 text-primary" href={`tel:${household.mobile}`}>
                  <Phone className="h-3.5 w-3.5" /> {household.mobile}
                </a>
              }
            />
            {household.altMobile ? <Item label="Alternate" value={household.altMobile} /> : null}
            <Item label="Previous year Vargani" value={formatINR(household.previousYearAmount)} />
            <Item label="Notes" value={household.notes || "—"} />
          </dl>
        </SectionCard>

        <SectionCard title="Collection & Pauti history" className="lg:col-span-2">
          {summary.collections.length === 0 ? (
            <EmptyState
              title="No collections yet"
              description="No Vargani has been recorded for this household this year."
              action={<Button onClick={() => setCollectOpen(true)}>Collect Vargani</Button>}
            />
          ) : (
            <ul className="space-y-2">
              {[...summary.collections].reverse().map((c) => (
                <li key={c.id} className="rounded-xl border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{c.pautiNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(c.date)} · {collectorName(c.collectorId)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <MethodBadge method={c.method} />
                      <span className="num font-bold">{formatINR(c.amount)}</span>
                    </div>
                  </div>
                  <div className="mt-2"><PautiActions collection={c} /></div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard title="Year-wise Vargani">
          <div className="grid gap-3 sm:grid-cols-3">
            <YearCard year={data.mandal.year - 2} amount={household.previousYearAmount} />
            <YearCard year={data.mandal.year - 1} amount={household.previousYearAmount} />
            <YearCard year={data.mandal.year} amount={summary.paid} highlight />
          </div>
        </SectionCard>
      </div>

      <CollectDialog householdId={household.id} open={collectOpen} onOpenChange={setCollectOpen} />
      <EditHouseholdDialog id={household.id} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

function YearCard({ year, amount, highlight }: { year: number; amount: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-primary bg-accent" : "bg-muted/40"}`}>
      <p className="text-xs tracking-wider uppercase text-muted-foreground">{year}</p>
      <p className="num text-xl font-bold">{formatINR(amount)}</p>
    </div>
  );
}

function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function EditHouseholdDialog({
  id,
  open,
  onOpenChange,
}: {
  id: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const data = useAppData();
  const household = data.households.find((h) => h.id === id)!;
  const [residentName, setResidentName] = useState(household.residentName);
  const [mobile, setMobile] = useState(household.mobile);
  const [expected, setExpected] = useState(String(household.expectedAmount));
  const [collectorId, setCollectorId] = useState(household.collectorId ?? "");
  const [notes, setNotes] = useState(household.notes ?? "");
  const [exempt, setExempt] = useState(household.exempt);

  const save = () => {
    if (!residentName.trim()) {
      toast.error("Resident name is required");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    const amount = Number(expected);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Expected Vargani must be positive");
      return;
    }
    updateHousehold(id, {
      residentName: residentName.trim(),
      mobile,
      expectedAmount: Math.round(amount),
      collectorId: collectorId || undefined,
      notes: notes.trim() || undefined,
      exempt,
    });
    toast.success("Household updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Edit household — {household.flatNo}</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Resident name</Label>
            <Input className="mt-1" value={residentName} onChange={(e) => setResidentName(e.target.value)} />
          </div>
          <div>
            <Label>Mobile</Label>
            <Input className="mt-1" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} />
          </div>
          <div>
            <Label>Expected Vargani</Label>
            <Input className="mt-1" value={expected} onChange={(e) => setExpected(e.target.value.replace(/\D/g, ""))} />
          </div>
          <div>
            <Label>Collector</Label>
            <Select value={collectorId} onValueChange={setCollectorId}>
              <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                {data.collectors.filter((c) => c.active).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={exempt ? "EXEMPT" : "ACTIVE"} onValueChange={(v) => setExempt(v === "EXEMPT")}>
              <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXEMPT">Exempt from Vargani</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Input className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
