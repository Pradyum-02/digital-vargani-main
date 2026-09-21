import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Plus, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  addIncome,
  removeIncome,
  useAppData,
} from "@/services/store";

import {
  activeExpenses,
  collectorPerformance,
  expenseByCategory,
  financialTotals,
} from "@/services/selectors";

import {
  amountInWords,
  formatDate,
  formatINR,
  toDateInput,
} from "@/lib/format";

import {
  downloadCSV,
  downloadHishob,
  printHishob,
} from "@/services/pdf";

import {
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
} from "@/components/app/ui-bits";

import {
  PAYMENT_METHODS,
  type IncomeSource,
  type PaymentMethod,
} from "@/types";

import { useAuth } from "@/services/auth";

export const Route = createFileRoute("/hishob")({
  head: () => ({
    meta: [
      {
        title: "Final Hishob — Digital Vargani",
      },
      {
        name: "description",
        content:
          "Complete Ganeshotsav income and expense statement with a printable Final Hishob PDF.",
      },
      {
        property: "og:title",
        content: "Final Hishob — Digital Vargani",
      },
      {
        property: "og:description",
        content:
          "Transparent Mandal accounts: income, expenses and closing balance.",
      },
    ],
  }),

  component: HishobPage,
});

function HishobPage() {
  const data = useAppData();
  const { profile } = useAuth();

  /*
   * Hishob income permissions
   *
   * SUPER_ADMIN:
   * - View income
   * - Add income
   * - Remove income
   *
   * COLLECTOR:
   * - View income only
   *
   * VIEWER:
   * - View income only
   */
  const canManageIncome =
    profile?.role === "SUPER_ADMIN";

  const totals = useMemo(
    () => financialTotals(data),
    [data],
  );

  const categories = useMemo(
    () => expenseByCategory(data),
    [data],
  );

  const perf = useMemo(
    () => collectorPerformance(data),
    [data],
  );

  const [incomeOpen, setIncomeOpen] =
    useState(false);

  const maxCategory =
    categories[0]?.amount ?? 1;

  const exportCsv = () =>
    downloadCSV(
      `hishob-${data.mandal.year}.csv`,
      [
        ["Section", "Item", "Amount"],

        [
          "Income",
          "Vargani collection",
          totals.totalCollection,
        ],

        [
          "Income",
          "Sponsorship",
          totals.sponsorship,
        ],

        [
          "Income",
          "Other income",
          totals.otherIncome,
        ],

        [
          "Income",
          "Total income",
          totals.totalIncome,
        ],

        ...categories.map(
          (c) =>
            [
              "Expense",
              c.category,
              c.amount,
            ] as Array<string | number>,
        ),

        [
          "Expense",
          "Total expenses",
          totals.totalExpenses,
        ],

        [
          "Balance",
          "Closing balance",
          totals.balance,
        ],
      ],
    );

  const handleRemoveIncome = (
    incomeId: string,
  ) => {
    if (!canManageIncome) {
      toast.error(
        "You do not have permission to remove income.",
      );
      return;
    }

    try {
      removeIncome(incomeId);
      toast.success("Income entry removed");
    } catch {
      toast.error(
        "Unable to remove the income entry.",
      );
    }
  };

  return (
    <>
      <PageHeader
        title="Final Hishob"
        marathi="अंतिम हिशोब"
        description={`Ganeshotsav ${data.mandal.year} · ${data.mandal.name}`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={exportCsv}
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                printHishob(data)
              }
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                downloadHishob(data);
                toast.success(
                  "Hishob PDF downloaded",
                );
              }}
            >
              <Download className="h-4 w-4" />
              Hishob PDF
            </Button>
          </>
        }
      />

      {/* Financial summary */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Income"
          marathi="एकूण जमा"
          value={formatINR(
            totals.totalIncome,
          )}
          tone="success"
        />

        <StatCard
          label="Total Expenses"
          marathi="एकूण खर्च"
          value={formatINR(
            totals.totalExpenses,
          )}
          tone="secondary"
        />

        <StatCard
          label="Closing Balance"
          marathi="शिल्लक"
          value={formatINR(
            totals.balance,
          )}
          tone={
            totals.balance >= 0
              ? "primary"
              : "danger"
          }
        />

        <StatCard
          label="Collection %"
          value={`${totals.collectionPercent}%`}
          tone="info"
          sub={`${formatINR(
            totals.pendingAmount,
          )} pending`}
        />
      </div>

      <p className="deva mt-3 text-sm text-muted-foreground">
        शिल्लक रक्कम:{" "}
        {amountInWords(
          Math.abs(totals.balance),
        )}
      </p>

      {/* Income + Expense categories */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Income"
          marathi="जमा"
          action={
            canManageIncome ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setIncomeOpen(true)
                }
              >
                <Plus className="h-4 w-4" />
                Add income
              </Button>
            ) : null
          }
        >
          <Row
            label="Vargani collection"
            value={totals.totalCollection}
          />

          <Row
            label="Sponsorship"
            value={totals.sponsorship}
          />

          <Row
            label="Other income"
            value={totals.otherIncome}
          />

          <Row
            label="Total income"
            value={totals.totalIncome}
            strong
          />

          {data.incomes.length > 0 ? (
            <div className="mt-3 space-y-1.5 border-t pt-3">
              {data.incomes.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {income.from}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {income.source ===
                      "SPONSORSHIP"
                        ? "Sponsorship"
                        : "Other"}{" "}
                      · {income.method} ·{" "}
                      {formatDate(
                        income.date,
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="num font-semibold">
                      {formatINR(
                        income.amount,
                      )}
                    </span>

                    {canManageIncome ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          handleRemoveIncome(
                            income.id,
                          )
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Expenses by category"
          marathi="खर्च तपशील"
        >
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No expenses recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.category}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {category.category}
                    </span>

                    <span className="num font-semibold">
                      {formatINR(
                        category.amount,
                      )}
                    </span>
                  </div>

                  <ProgressBar
                    percent={Math.round(
                      (category.amount /
                        maxCategory) *
                        100,
                    )}
                    tone="secondary"
                  />
                </div>
              ))}

              <div className="flex items-center justify-between border-t pt-3 text-sm font-bold">
                <span>
                  Total expenses
                </span>

                <span className="num">
                  {formatINR(
                    totals.totalExpenses,
                  )}
                </span>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Payment + Collector split */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Payment method split"
          marathi="देयक प्रकार"
        >
          {(
            Object.keys(
              totals.byMethod,
            ) as PaymentMethod[]
          ).map((method) => (
            <Row
              key={method}
              label={method}
              value={
                totals.byMethod[method]
              }
            />
          ))}
        </SectionCard>

        <SectionCard
          title="Collector-wise collection"
          marathi="कार्यकर्ता जमा"
        >
          {perf.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No collectors added yet.
            </p>
          ) : (
            perf
              .slice()
              .sort(
                (a, b) =>
                  b.amount - a.amount,
              )
              .map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between border-b py-2 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {person.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {
                        person.collectedHouseholds
                      }
                      /
                      {person.assigned}{" "}
                      households
                    </p>
                  </div>

                  <span className="num font-semibold">
                    {formatINR(
                      person.amount,
                    )}
                  </span>
                </div>
              ))
          )}
        </SectionCard>
      </div>

      {/* Expense records */}
      <SectionCard
        title="Expense records"
        marathi="खर्च नोंदी"
        className="mt-4"
      >
        {activeExpenses(data).length ===
        0 ? (
          <p className="text-sm text-muted-foreground">
            No expense records yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs tracking-wide uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">
                    Date
                  </th>

                  <th className="py-2">
                    Category
                  </th>

                  <th className="py-2">
                    Description
                  </th>

                  <th className="py-2 text-right">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {activeExpenses(data)
                  .slice()
                  .sort((a, b) =>
                    a.date.localeCompare(
                      b.date,
                    ),
                  )
                  .map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-t"
                    >
                      <td className="py-2 text-muted-foreground">
                        {formatDate(
                          expense.date,
                        )}
                      </td>

                      <td className="py-2">
                        {expense.category}
                      </td>

                      <td className="py-2">
                        {expense.description}
                      </td>

                      <td className="num py-2 text-right font-semibold">
                        {formatINR(
                          expense.amount,
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Only Super Admin can open/manage income */}
      {canManageIncome ? (
        <AddIncomeDialog
          open={incomeOpen}
          onOpenChange={setIncomeOpen}
        />
      ) : null}
    </>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b py-2 text-sm last:border-0 ${
        strong ? "font-bold" : ""
      }`}
    >
      <span>{label}</span>

      <span className="num">
        {formatINR(value)}
      </span>
    </div>
  );
}

function AddIncomeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { profile } = useAuth();

  const canManageIncome =
    profile?.role === "SUPER_ADMIN";

  const [source, setSource] =
    useState<IncomeSource>(
      "SPONSORSHIP",
    );

  const [from, setFrom] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [method, setMethod] =
    useState<PaymentMethod>("UPI");

  const [date, setDate] = useState(
    toDateInput(
      new Date().toISOString(),
    ),
  );

  const submit = () => {
    /*
     * Extra protection in case the dialog
     * is somehow triggered by another role.
     */
    if (!canManageIncome) {
      toast.error(
        "You do not have permission to add income.",
      );
      return;
    }

    const value = Number(amount);

    if (!from.trim()) {
      toast.error(
        "Please enter who this income is from",
      );
      return;
    }

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      toast.error(
        "Amount must be greater than ₹0",
      );
      return;
    }

    try {
      addIncome({
        source,
        from: from.trim(),
        amount: Math.round(value),
        method,
        date: new Date(
          `${date}T12:00:00`,
        ).toISOString(),
      });

      toast.success("Income added");

      setFrom("");
      setAmount("");

      onOpenChange(false);
    } catch {
      toast.error(
        "Unable to save the income. Please try again.",
      );
    }
  };

  return (
    <Dialog
      open={open && canManageIncome}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add income
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div>
            <Label>
              Source
            </Label>

            <Select
              value={source}
              onValueChange={(value) =>
                setSource(
                  value as IncomeSource,
                )
              }
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="SPONSORSHIP">
                  Sponsorship
                </SelectItem>

                <SelectItem value="OTHER">
                  Other income
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              From
            </Label>

            <Input
              className="mt-1"
              value={from}
              onChange={(e) =>
                setFrom(e.target.value)
              }
              placeholder="Sponsor or source name"
            />
          </div>

          <div>
            <Label>
              Amount
            </Label>

            <Input
              className="num mt-1"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value.replace(
                    /[^\d]/g,
                    "",
                  ),
                )
              }
              placeholder="0"
            />
          </div>

          <div>
            <Label>
              Method
            </Label>

            <Select
              value={method}
              onValueChange={(value) =>
                setMethod(
                  value as PaymentMethod,
                )
              }
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {PAYMENT_METHODS.map(
                  (paymentMethod) => (
                    <SelectItem
                      key={paymentMethod}
                      value={paymentMethod}
                    >
                      {paymentMethod}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>
              Date
            </Label>

            <Input
              className="mt-1"
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
          >
            Cancel
          </Button>

          <Button onClick={submit}>
            Add income
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}