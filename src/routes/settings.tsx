import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMandal, useAppData } from "@/services/store";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { downloadCSV } from "@/services/pdf";
import { PageHeader, SectionCard } from "@/components/app/ui-bits";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Mandal Settings — Digital Vargani" },
      {
        name: "description",
        content:
          "Configure Mandal profile, receipt prefix, default Vargani amount and festival year.",
      },
      {
        property: "og:title",
        content: "Mandal Settings — Digital Vargani",
      },
      {
        property: "og:description",
        content: "Mandal identity and Pauti configuration in one place.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const data = useAppData();
  const m = data.mandal;
  const [form, setForm] = useState({ ...m });

  const set = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    if (!form.name.trim()) {
      toast.error("Mandal name is required");
      return;
    }

    if (!form.pautiPrefix.trim()) {
      toast.error("Pauti prefix is required");
      return;
    }

    if (
      !Number.isFinite(Number(form.defaultVarganiAmount)) ||
      Number(form.defaultVarganiAmount) <= 0
    ) {
      toast.error("Default Vargani amount must be greater than ₹0");
      return;
    }

    updateMandal({
      ...form,
      defaultVarganiAmount: Math.round(
        Number(form.defaultVarganiAmount),
      ),
      year: Math.round(Number(form.year)),
      pautiPrefix: form.pautiPrefix.trim().toUpperCase(),
    });

    toast.success("Settings saved");
  };

  const backup = () =>
  downloadCSV(`vargani-backup-${m.year}.csv`, [
    ["Type", "Ref", "Date", "Description", "Amount"],

    ...data.collections.map((c) => [
      c.voided ? "COLLECTION (VOID)" : "COLLECTION",
      c.pautiNo,
      formatDate(c.date),
      data.households.find((h) => h.id === c.householdId)?.flatNo ?? "",
      c.amount,
    ]),

    ...data.expenses.map((e) => [
      e.voided ? "EXPENSE (VOID)" : "EXPENSE",
      e.category,
      formatDate(e.date),
      e.description,
      e.amount,
    ]),

    ...data.incomes.map((i) => [
      i.source,
      i.method,
      formatDate(i.date),
      i.from,
      i.amount,
    ]),
  ]);

  return (
    <>
      <PageHeader
        title="Settings"
        marathi="सेटिंग्ज"
        description="Mandal profile, receipt configuration and data tools"
        actions={
          <Button onClick={save}>
            <Save className="h-4 w-4" /> Save changes
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Mandal profile" marathi="मंडळ माहिती">
          <div className="grid gap-3">
            <div>
              <Label>Mandal name (English)</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>

            <div>
              <Label>Mandal name (Marathi)</Label>
              <Input
                className="deva mt-1"
                value={form.nameMarathi}
                onChange={(e) => set("nameMarathi", e.target.value)}
              />
            </div>

            <div>
              <Label>Address</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Contact number</Label>
                <Input
                  className="num mt-1"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>

              <div>
                <Label>Festival year</Label>
                <Input
                  className="num mt-1"
                  inputMode="numeric"
                  value={String(form.year)}
                  onChange={(e) =>
                    set(
                      "year",
                      Number(e.target.value.replace(/\D/g, "")) ||
                        form.year,
                    )
                  }
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Pauti & Vargani" marathi="पावती सेटिंग्ज">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Pauti prefix</Label>
                <Input
                  className="mt-1 uppercase"
                  value={form.pautiPrefix}
                  onChange={(e) => set("pautiPrefix", e.target.value)}
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Next Pauti will look like{" "}
                  {form.pautiPrefix.toUpperCase()}-{form.year}-0001
                </p>
              </div>

              <div>
                <Label>Default Vargani amount</Label>
                <Input
                  className="num mt-1"
                  inputMode="numeric"
                  value={String(form.defaultVarganiAmount)}
                  onChange={(e) =>
                    set(
                      "defaultVarganiAmount",
                      Number(e.target.value.replace(/\D/g, "")) || 0,
                    )
                  }
                />
              </div>
            </div>

            <div>
              <Label>Receipt footer message</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={form.receiptFooter}
                onChange={(e) => set("receiptFooter", e.target.value)}
              />
            </div>

            <div>
              <Label>Receipt language</Label>
              <Select
                value={form.language}
                onValueChange={(v) =>
                  set("language", v as "en" | "mr")
                }
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="mr">
                    मराठी (Marathi)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Buildings & wings" marathi="इमारत व विंग">
          <div className="space-y-3">
            {data.buildings.map((b) => (
              <div key={b.id} className="rounded-xl border p-3">
                <p className="font-semibold">{b.name}</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Wings:{" "}
                  {data.wings
                    .filter((w) => w.buildingId === b.id)
                    .map((w) => w.name)
                    .join(", ") || "—"}
                </p>

                <p className="text-xs text-muted-foreground">
                  {formatNumber(
                    data.households.filter(
                      (h) =>
                        h.buildingId === b.id && !h.archived,
                    ).length,
                  )}{" "}
                  households
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Data & backup" marathi="डेटा">
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border p-3">
              <p className="font-medium">Data & backup</p>

              <p className="mt-1 text-xs text-muted-foreground">
                {formatNumber(data.households.length)} households ·{" "}
                {formatNumber(data.collections.length)} collections ·{" "}
                {formatNumber(data.expenses.length)} expenses ·{" "}
                {formatINR(
                  data.collections
                    .filter((c) => !c.voided)
                    .reduce((s, c) => s + c.amount, 0),
                )}{" "}
                collected
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Data is synced with Supabase and cached locally for
                faster loading.
              </p>

              <Button
                className="mt-3"
                variant="outline"
                onClick={backup}
              >
                Download full backup (CSV)
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
}