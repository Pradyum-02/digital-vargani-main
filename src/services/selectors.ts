import type { AppData, Collection, Household, HouseholdStatus, PaymentMethod } from "@/types";

export interface HouseholdSummary {
  household: Household;
  buildingName: string;
  wingName: string;
  collectorName: string;
  paid: number;
  remaining: number;
  status: HouseholdStatus;
  collections: Collection[];
}

export function activeCollections(data: AppData): Collection[] {
  return data.collections.filter((c) => !c.voided);
}

export function activeExpenses(data: AppData) {
  return data.expenses.filter((e) => !e.voided);
}

export function activeHouseholds(data: AppData): Household[] {
  return data.households.filter((h) => !h.archived);
}

export function householdSummaries(data: AppData): HouseholdSummary[] {
  const byHousehold = new Map<string, Collection[]>();
  activeCollections(data).forEach((c) => {
    const list = byHousehold.get(c.householdId) ?? [];
    list.push(c);
    byHousehold.set(c.householdId, list);
  });
  const buildings = new Map(data.buildings.map((b) => [b.id, b.name]));
  const wings = new Map(data.wings.map((w) => [w.id, w.name]));
  const collectors = new Map(data.collectors.map((c) => [c.id, c.name]));

  return activeHouseholds(data).map((household) => {
    const cols = (byHousehold.get(household.id) ?? []).sort((a, b) => a.date.localeCompare(b.date));
    const paid = cols.reduce((s, c) => s + c.amount, 0);
    const remaining = Math.max(0, household.expectedAmount - paid);
    const status: HouseholdStatus = household.exempt
      ? "EXEMPT"
      : paid <= 0
        ? "PENDING"
        : remaining > 0
          ? "PARTIAL"
          : "PAID";
    return {
      household,
      buildingName: buildings.get(household.buildingId) ?? "—",
      wingName: wings.get(household.wingId) ?? "—",
      collectorName: collectors.get(household.collectorId ?? "") ?? "Unassigned",
      paid,
      remaining,
      status,
      collections: cols,
    };
  });
}

export function summaryFor(data: AppData, householdId: string): HouseholdSummary | undefined {
  return householdSummaries(data).find((s) => s.household.id === householdId);
}

export interface FinancialTotals {
  totalCollection: number;
  byMethod: Record<PaymentMethod, number>;
  transactions: number;
  contributors: number;
  paidCount: number;
  partialCount: number;
  pendingCount: number;
  exemptCount: number;
  totalHouseholds: number;
  expectedTotal: number;
  pendingAmount: number;
  collectionPercent: number;
  sponsorship: number;
  otherIncome: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export function financialTotals(data: AppData): FinancialTotals {
  const cols = activeCollections(data);
  const summaries = householdSummaries(data);
  const byMethod: Record<PaymentMethod, number> = { UPI: 0, CASH: 0, BANK: 0, CHEQUE: 0 };
  cols.forEach((c) => {
    byMethod[c.method] += c.amount;
  });
  const totalCollection = cols.reduce((s, c) => s + c.amount, 0);
  const counted = summaries.filter((s) => s.status !== "EXEMPT");
  const expectedTotal = counted.reduce((s, x) => s + x.household.expectedAmount, 0);
  const pendingAmount = counted.reduce((s, x) => s + x.remaining, 0);
  const sponsorship = data.incomes
    .filter((i) => i.source === "SPONSORSHIP")
    .reduce((s, i) => s + i.amount, 0);
  const otherIncome = data.incomes
    .filter((i) => i.source === "OTHER")
    .reduce((s, i) => s + i.amount, 0);
  const totalExpenses = activeExpenses(data).reduce((s, e) => s + e.amount, 0);
  const totalIncome = totalCollection + sponsorship + otherIncome;

  return {
    totalCollection,
    byMethod,
    transactions: cols.length,
    contributors: new Set(cols.map((c) => c.householdId)).size,
    paidCount: summaries.filter((s) => s.status === "PAID").length,
    partialCount: summaries.filter((s) => s.status === "PARTIAL").length,
    pendingCount: summaries.filter((s) => s.status === "PENDING").length,
    exemptCount: summaries.filter((s) => s.status === "EXEMPT").length,
    totalHouseholds: summaries.length,
    expectedTotal,
    pendingAmount,
    collectionPercent: expectedTotal ? Math.round((totalCollection / expectedTotal) * 100) : 0,
    sponsorship,
    otherIncome,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
  };
}

export function expenseByCategory(data: AppData): Array<{ category: string; amount: number }> {
  const map = new Map<string, number>();
  activeExpenses(data).forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export interface CollectorPerformance {
  id: string;
  name: string;
  assigned: number;
  collectedHouseholds: number;
  pendingHouseholds: number;
  amount: number;
  todayAmount: number;
  upi: number;
  cash: number;
}

export function collectorPerformance(data: AppData): CollectorPerformance[] {
  const summaries = householdSummaries(data);
  const cols = activeCollections(data);
  const today = new Date().toDateString();
  return data.collectors
    .filter((c) => c.role === "COLLECTOR")
    .map((c) => {
      const mine = summaries.filter((s) => s.household.collectorId === c.id);
      const myCols = cols.filter((x) => x.collectorId === c.id);
      return {
        id: c.id,
        name: c.name,
        assigned: mine.length,
        collectedHouseholds: mine.filter((s) => s.paid > 0).length,
        pendingHouseholds: mine.filter((s) => s.status === "PENDING").length,
        amount: myCols.reduce((s, x) => s + x.amount, 0),
        todayAmount: myCols
          .filter((x) => new Date(x.date).toDateString() === today)
          .reduce((s, x) => s + x.amount, 0),
        upi: myCols.filter((x) => x.method === "UPI").reduce((s, x) => s + x.amount, 0),
        cash: myCols.filter((x) => x.method === "CASH").reduce((s, x) => s + x.amount, 0),
      };
    });
}

export function currentUser(data: AppData) {
  return data.collectors.find(
    (collector) => collector.id === data.currentUserId,
  );
}

export function visibleHouseholds(data: AppData, summaries: HouseholdSummary[]) {
  const user = currentUser(data);
  if (!user || user.role !== "COLLECTOR") return summaries;
  return summaries.filter((s) => s.household.collectorId === user.id);
}
