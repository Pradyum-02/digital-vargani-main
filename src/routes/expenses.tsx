import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Download,
  FileText,
  Paperclip,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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

import { addExpense, useAppData, voidExpense } from "@/services/store";
import { activeExpenses, expenseByCategory } from "@/services/selectors";
import { formatDate, formatINR, toDateInput } from "@/lib/format";
import { downloadCSV } from "@/services/pdf";
import { fileStorage, openAttachment } from "@/services/files";

import {
  EmptyState,
  MethodBadge,
  PageHeader,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components/app/ui-bits";

import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type ExpenseAttachment,
  type PaymentMethod,
} from "@/types";

type Search = {
  q?: string | undefined;
  category?: string | undefined;
  method?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
};

export const Route = createFileRoute("/expenses")({
  validateSearch: (s: Record<string, unknown>): Search =>
    Object.fromEntries(
      ["q", "category", "method", "from", "to"].map((k) => [
        k,
        typeof s[k] === "string" ? (s[k] as string) : undefined,
      ]),
    ),

  head: () => ({
    meta: [
      { title: "Expenses — Digital Vargani" },
      {
        name: "description",
        content:
          "Record Ganeshotsav expenses by category with bills attached, and track the total spend.",
      },
      {
        property: "og:title",
        content: "Expenses — Digital Vargani",
      },
      {
        property: "og:description",
        content:
          "Mandap, decoration, prasad, visarjan and every other Mandal expense.",
      },
    ],
  }),

  component: ExpensesPage,
});

function ExpensesPage() {
  const data = useAppData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [addOpen, setAddOpen] = useState(false);
  const [voidId, setVoidId] = useState<string | null>(null);

  const setSearch = (patch: Search) =>
    navigate({
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    });

  const total = useMemo(
    () => activeExpenses(data).reduce((s, e) => s + e.amount, 0),
    [data],
  );

  const byCategory = useMemo(
    () => expenseByCategory(data),
    [data],
  );

  const q = (search.q ?? "").trim().toLowerCase();

  const rows = data.expenses
    .filter((e) => {
      if (
        q &&
        ![e.description, e.paidTo, e.category].some((v) =>
          v.toLowerCase().includes(q),
        )
      ) {
        return false;
      }

      if (
        search.category &&
        search.category !== "ALL" &&
        e.category !== search.category
      ) {
        return false;
      }

      if (
        search.method &&
        search.method !== "ALL" &&
        e.method !== search.method
      ) {
        return false;
      }

      if (search.from && e.date < search.from) {
        return false;
      }

      if (search.to && e.date > `${search.to}T23:59:59`) {
        return false;
      }

      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const exportCsv = () =>
    downloadCSV(`expenses-${data.mandal.year}.csv`, [
      [
        "Date",
        "Category",
        "Description",
        "Paid To",
        "Amount",
        "Method",
        "Status",
      ],

      ...rows.map((e) => [
        formatDate(e.date),
        e.category,
        e.description,
        e.paidTo,
        e.amount,
        e.method,
        e.voided ? "VOID" : "ACTIVE",
      ]),
    ]);

  return (
    <>
      <PageHeader
        title="Expenses"
        marathi="खर्च"
        description={`${rows.length} records · ${formatINR(total)} total spend`}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>

            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add expense
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Expenses"
          marathi="एकूण खर्च"
          value={formatINR(total)}
          tone="secondary"
        />

        {byCategory.slice(0, 3).map((c) => (
          <StatCard
            key={c.category}
            label={c.category}
            value={formatINR(c.amount)}
          />
        ))}
      </div>

      <SectionCard title="Filters" className="my-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />

            <Input
              className="pl-9"
              placeholder="Description or vendor"
              value={search.q ?? ""}
              onChange={(e) =>
                setSearch({
                  q: e.target.value || undefined,
                })
              }
            />
          </div>

          <Select
            value={search.category ?? "ALL"}
            onValueChange={(v) =>
              setSearch({
                category: v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">
                All categories
              </SelectItem>

              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={search.method ?? "ALL"}
            onValueChange={(v) =>
              setSearch({
                method: v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">
                All methods
              </SelectItem>

              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={search.from ?? ""}
            onChange={(e) =>
              setSearch({
                from: e.target.value || undefined,
              })
            }
          />

          <Input
            type="date"
            value={search.to ?? ""}
            onChange={(e) =>
              setSearch({
                to: e.target.value || undefined,
              })
            }
          />
        </div>
      </SectionCard>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-8 w-8" />}
          title="No expenses recorded yet"
          description="Add your first expense to start tracking the Ganeshotsav Hishob."
          action={
            <Button onClick={() => setAddOpen(true)}>
              Add your first expense
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile */}
          <div className="space-y-2 lg:hidden">
            {rows.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border bg-card p-3 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {e.category}
                    </p>

                    {e.description ? (
                      <p className="text-xs text-muted-foreground">
                        {e.description}
                      </p>
                    ) : null}
                  </div>

                  <span className="num font-bold">
                    {formatINR(e.amount)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <MethodBadge method={e.method} />

                  {e.voided ? (
                    <StatusBadge status="VOID" />
                  ) : null}

                  <span>{e.paidTo}</span>
                  <span>{formatDate(e.date)}</span>

                  {e.attachment ? (
                    <button
                      className="text-primary underline"
                      onClick={() =>
                        openAttachment(e.attachment!)
                      }
                    >
                      View bill
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-card lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs tracking-wide uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Paid To</th>
                  <th className="px-4 py-3 text-right">
                    Amount
                  </th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Bill</th>
                  <th className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t hover:bg-muted/40"
                  >
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatDate(e.date)}
                    </td>

                    <td className="px-4 py-2.5 font-medium">
                      {e.category}
                    </td>

                    <td className="px-4 py-2.5">
                      {e.description || "—"}

                      {e.voided ? (
                        <span className="ml-2">
                          <StatusBadge status="VOID" />
                        </span>
                      ) : null}
                    </td>

                    <td className="px-4 py-2.5 text-muted-foreground">
                      {e.paidTo}
                    </td>

                    <td className="num px-4 py-2.5 text-right font-semibold">
                      {formatINR(e.amount)}
                    </td>

                    <td className="px-4 py-2.5">
                      <MethodBadge method={e.method} />
                    </td>

                    <td className="px-4 py-2.5">
                      {e.attachment ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            openAttachment(e.attachment!)
                          }
                        >
                          <FileText className="h-4 w-4" />
                          View
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 text-right">
                      {!e.voided ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setVoidId(e.id)}
                        >
                          Void
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AddExpenseDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <AlertDialog
        open={voidId !== null}
        onOpenChange={(v) =>
          !v && setVoidId(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Void this expense?
            </AlertDialogTitle>

            <AlertDialogDescription>
              The record stays in history for audit purposes
              but is removed from the Hishob totals.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={() => {
                voidExpense(voidId!);
                toast.success("Expense voided");
                setVoidId(null);
              }}
            >
              Void expense
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AddExpenseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [category, setCategory] = useState<string>(
    EXPENSE_CATEGORIES[0],
  );

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] =
    useState<PaymentMethod>("UPI");

  const [date, setDate] = useState(
    toDateInput(new Date().toISOString()),
  );

  const [paidTo, setPaidTo] = useState("");
  const [notes, setNotes] = useState("");

  const [attachment, setAttachment] =
    useState<ExpenseAttachment | undefined>();

  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = async (file?: File) => {
    if (!file) return;

    try {
      setAttachment(await fileStorage.upload(file));
      toast.success("Bill attached");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to attach the bill.",
      );
    }
  };

  const submit = () => {
    const value = Number(amount);

    /*
     * Description is OPTIONAL.
     */
    if (!Number.isFinite(value) || value <= 0) {
      toast.error(
        "Expense amount must be greater than ₹0",
      );
      return;
    }

    if (!paidTo.trim()) {
      toast.error("Paid to is required");
      return;
    }

    setSaving(true);

    try {
      addExpense({
        category,
        description: description.trim(),
        amount: Math.round(value),
        method,
        date: new Date(
          `${date}T12:00:00`,
        ).toISOString(),
        paidTo: paidTo.trim(),
        notes: notes.trim() || undefined,
        attachment,
      });

      toast.success("Expense added");

      setDescription("");
      setAmount("");
      setPaidTo("");
      setNotes("");
      setAttachment(undefined);

      onOpenChange(false);
    } catch {
      toast.error(
        "Unable to save the expense. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add expense
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Category</Label>

            <Select
              value={category}
              onValueChange={setCategory}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Amount</Label>

            <Input
              className="num mt-1"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value.replace(/[^\d]/g, ""),
                )
              }
              placeholder="0"
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Description (optional)</Label>

            <Input
              className="mt-1"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Main stage flower decoration"
            />
          </div>

          <div>
            <Label>Paid to</Label>

            <Input
              className="mt-1"
              value={paidTo}
              onChange={(e) =>
                setPaidTo(e.target.value)
              }
              placeholder="Vendor name"
            />
          </div>

          <div>
            <Label>Date</Label>

            <Input
              className="mt-1"
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Payment method</Label>

            <Select
              value={method}
              onValueChange={(v) =>
                setMethod(v as PaymentMethod)
              }
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label>Notes</Label>

            <Textarea
              className="mt-1"
              rows={2}
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Label>
              Bill / receipt (PDF, JPG, PNG)
            </Label>

            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(e) =>
                pickFile(e.target.files?.[0])
              }
            />

            <div className="mt-1 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  fileRef.current?.click()
                }
              >
                <Paperclip className="h-4 w-4" />
                Attach bill
              </Button>

              {attachment ? (
                <button
                  type="button"
                  className="text-sm text-primary underline"
                  onClick={() =>
                    openAttachment(attachment)
                  }
                >
                  {attachment.name}
                </button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No file attached
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            onClick={submit}
            disabled={saving}
          >
            {saving
              ? "Saving…"
              : "Save expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}