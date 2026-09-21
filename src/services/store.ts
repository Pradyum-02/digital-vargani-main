import { useSyncExternalStore } from "react";
import { buildSeedData } from "@/data/seed";
import type {
  AppData,
  AppNotification,
  Collection,
  Collector,
  Expense,
  Household,
  IncomeRecord,
  Mandal,
} from "@/types";

import {
  loadAppData,
  saveAppData,
  deleteIncome as deleteIncomeFromSupabase,
  subscribeToRealtime,
} from "@/services/supabase-data";

const STORAGE_KEY = "digital-vargani:v2";
const LEGACY_STORAGE_KEY = "digital-vargani:v1";

let data: AppData = buildSeedData();

const serverSnapshot: AppData = data;

let hydrated = false;
let hydrating = false;

/**
 * Changes made while the initial Supabase request is running
 * must not be overwritten by the old remote snapshot.
 */
let localChangeVersion = 0;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/**
 * Supabase writes are queued so writes happen in order.
 */
let supabaseSaveQueue = Promise.resolve();

/**
 * Realtime subscription cleanup.
 */
let realtimeUnsubscribe:
  | (() => void)
  | undefined;

/**
 * Prevent multiple realtime subscriptions.
 */
let realtimeStarted = false;

/**
 * Realtime refreshes are queued so multiple realtime
 * events cannot cause overlapping full-data reloads.
 */
let realtimeRefreshQueue = Promise.resolve();

function persist() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data),
    );
  } catch {
    /* local storage unavailable */
  }

  supabaseSaveQueue = supabaseSaveQueue
    .then(() => saveAppData(data))
    .catch((error) => {
      console.error(
        "Supabase save failed:",
        error,
      );
    });
}

function commit(next: AppData) {
  data = next;

  /**
   * Any commit means the user/app changed local state.
   *
   * This is especially important while hydration is in progress.
   */
  if (hydrating) {
    localChangeVersion += 1;
  }

  persist();
  emit();
}

/**
 * Refresh the application data from Supabase.
 *
 * Supabase Realtime tells us that something changed.
 * We then reload the complete application state so
 * every related screen stays synchronized.
 */
export function refreshAppData() {
  realtimeRefreshQueue =
    realtimeRefreshQueue
      .then(async () => {
        /**
         * Wait for local writes that were already queued
         * by this browser.
         *
         * This prevents a Realtime refresh from replacing
         * an optimistic local change before its own save
         * has completed.
         */
        await supabaseSaveQueue;

        const remoteData =
          await loadAppData(data);

        if (!remoteData) {
          console.error(
            "Digital Vargani: Realtime refresh failed to load Supabase data",
          );
          return;
        }

        /**
         * Keep this browser's currentUserId.
         *
         * Another device must never change the currently
         * logged-in user's local identity.
         */
        data = {
          ...remoteData,
          currentUserId:
            data.currentUserId,
        };

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify(data),
            );
          } catch {
            /* local storage unavailable */
          }
        }

        emit();

        console.log(
          "Digital Vargani: live data refreshed",
        );
      })
      .catch((error) => {
        console.error(
          "Digital Vargani: Realtime refresh failed:",
          error,
        );
      });

  return realtimeRefreshQueue;
}

/**
 * Start Supabase Realtime.
 *
 * This is deliberately started only after the initial
 * application hydration has finished.
 */
function startRealtimeSync() {
  if (
    realtimeStarted ||
    typeof window === "undefined"
  ) {
    return;
  }

  realtimeStarted = true;

  realtimeUnsubscribe =
    subscribeToRealtime(() => {
      void refreshAppData();
    });

  console.log(
    "Digital Vargani: live sync enabled",
  );
}

/**
 * Hydrate the application from local storage and Supabase.
 *
 * Important:
 * If the user creates a Vargani/expense while the initial
 * Supabase request is still running, the remote snapshot is
 * ignored and the newer local state is preserved.
 */
export async function hydrateFromStorage() {
  if (
    hydrated ||
    hydrating ||
    typeof window === "undefined"
  ) {
    return;
  }

  hydrating = true;

  try {
    try {
      window.localStorage.removeItem(
        LEGACY_STORAGE_KEY,
      );
    } catch {
      /* local storage unavailable */
    }

    let localData: AppData | null = null;

    /**
     * Load the current v2 browser snapshot first.
     */
    try {
      const raw =
        window.localStorage.getItem(
          STORAGE_KEY,
        );

      if (raw) {
        const parsed =
          JSON.parse(raw) as AppData;

        if (
          parsed &&
          parsed.mandal &&
          Array.isArray(
            parsed.households,
          )
        ) {
          localData = {
            ...buildSeedData(),
            ...parsed,
          };

          data = localData;
          emit();
        }
      }
    } catch {
      /* Ignore corrupt local storage. */
    }

    /**
     * Record the version before starting
     * the remote request.
     */
    const versionBeforeRemoteLoad =
      localChangeVersion;

    try {
      const remoteData =
        await loadAppData(
          localData ?? data,
        );

      /**
       * If anything changed while Supabase
       * was loading, do NOT replace the newer
       * local state with the older remote snapshot.
       */
      if (
        remoteData &&
        localChangeVersion ===
          versionBeforeRemoteLoad
      ) {
        data = remoteData;

        window.localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(data),
        );

        emit();

        console.log(
          "Digital Vargani: loaded from Supabase",
        );

        return;
      }

      /**
       * A local change happened during hydration.
       *
       * That local state has already been queued
       * for Supabase.
       */
      if (
        remoteData &&
        localChangeVersion !==
          versionBeforeRemoteLoad
      ) {
        console.log(
          "Digital Vargani: preserving local changes made during hydration",
        );

        return;
      }

      /**
       * Supabase has no application data yet.
       */
      if (!remoteData) {
        await saveAppData(data);

        console.log(
          "Digital Vargani: initial Vedant Residency data saved to Supabase",
        );
      }
    } catch (error) {
      console.error(
        "Supabase hydration failed. Using local data:",
        error,
      );
    }
  } finally {
    hydrating = false;
    hydrated = true;

    /**
     * Start Realtime only after the initial
     * hydration process has finished.
     */
    startRealtimeSync();
  }
}

/**
 * Backward-compatible function.
 *
 * Kept so existing imports do not break.
 *
 * It resets the application to the clean initial
 * Vedant Residency configuration.
 */
export function resetDemoData() {
  commit(buildSeedData());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => listeners.delete(listener);
}

export function getData(): AppData {
  return data;
}

export function useAppData(): AppData {
  return useSyncExternalStore(
    subscribe,
    () => data,
    () => serverSnapshot,
  );
}

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;

function log(
  next: AppData,
  action: string,
  entity: string,
  entityId: string,
  before?: unknown,
  after?: unknown,
) {
  next.auditLogs = [
    {
      id: uid("log"),
      userId: next.currentUserId,
      action,
      entity,
      entityId,
      before: before
        ? JSON.stringify(before)
        : undefined,
      after: after
        ? JSON.stringify(after)
        : undefined,
      date: new Date().toISOString(),
    },
    ...next.auditLogs,
  ].slice(0, 500);
}

function notify(
  next: AppData,
  n: Omit<
    AppNotification,
    "id" | "date" | "read"
  >,
) {
  next.notifications = [
    {
      ...n,
      id: uid("ntf"),
      date: new Date().toISOString(),
      read: false,
    },
    ...next.notifications,
  ].slice(0, 100);
}

export function nextPautiNo(): string {
  const { mandal, collections } =
    data;

  const prefix =
    `${mandal.pautiPrefix}-${mandal.year}-`;

  const max = collections
    .filter((collection) =>
      collection.pautiNo.startsWith(
        prefix,
      ),
    )
    .reduce(
      (maximum, collection) =>
        Math.max(
          maximum,
          Number(
            collection.pautiNo.slice(
              prefix.length,
            ),
          ) || 0,
        ),
      0,
    );

  return `${prefix}${String(
    max + 1,
  ).padStart(5, "0")}`;
}

/* ---------- Households ---------- */

export function findHouseholdByLocation({
  buildingId,
  wingId,
  floor,
  flatNo,
}: {
  buildingId: string;
  wingId: string;
  floor: number;
  flatNo: string;
}): Household | undefined {
  const normalizedFlat =
    flatNo.trim().toUpperCase();

  return data.households.find(
    (household) =>
      !household.archived &&
      household.buildingId ===
        buildingId &&
      household.wingId === wingId &&
      household.floor === floor &&
      household.flatNo
        .trim()
        .toUpperCase() ===
        normalizedFlat,
  );
}

export function addHousehold(
  input: Omit<Household, "id">,
): Household {
  const household: Household = {
    ...input,
    id: uid("hh"),
  };

  const next = {
    ...data,
    households: [
      ...data.households,
      household,
    ],
  };

  log(
    next,
    "CREATE",
    "household",
    household.id,
    undefined,
    household,
  );

  commit(next);

  return household;
}

export function updateHousehold(
  id: string,
  patch: Partial<Household>,
) {
  const before =
    data.households.find(
      (household) =>
        household.id === id,
    );

  const next = {
    ...data,
    households: data.households.map(
      (household) =>
        household.id === id
          ? {
              ...household,
              ...patch,
            }
          : household,
    ),
  };

  log(
    next,
    "UPDATE",
    "household",
    id,
    before,
    {
      ...before,
      ...patch,
    },
  );

  commit(next);
}

export function archiveHousehold(
  id: string,
) {
  updateHousehold(id, {
    archived: true,
  });
}

/* ---------- Collections ---------- */

export function addCollection(input: {
  householdId: string;
  amount: number;
  method: Collection["method"];
  collectorId: string;
  date: string;
  notes?: string | undefined;
}): Collection {
  const collection: Collection = {
    ...input,
    id: uid("col"),
    pautiNo: nextPautiNo(),
  };

  const next = {
    ...data,
    collections: [
      ...data.collections,
      collection,
    ],
  };

  const household =
    data.households.find(
      (item) =>
        item.id === input.householdId,
    );

  log(
    next,
    "CREATE",
    "collection",
    collection.id,
    undefined,
    collection,
  );

  notify(next, {
    type: "COLLECTION",
    title: `Collection recorded — ${collection.pautiNo}`,
    body: `${
      household?.flatNo ??
      "Household"
    } · ₹${input.amount.toLocaleString(
      "en-IN",
    )} via ${input.method}`,
  });

  commit(next);

  return collection;
}

export function voidCollection(
  id: string,
  reason: string,
) {
  const before =
    data.collections.find(
      (collection) =>
        collection.id === id,
    );

  const next = {
    ...data,
    collections: data.collections.map(
      (collection) =>
        collection.id === id
          ? {
              ...collection,
              voided: true,
              voidReason: reason,
            }
          : collection,
    ),
  };

  log(
    next,
    "VOID",
    "collection",
    id,
    before,
    {
      ...before,
      voided: true,
      voidReason: reason,
    },
  );

  commit(next);
}

export function updateCollectionNotes(
  id: string,
  notes: string,
) {
  const before =
    data.collections.find(
      (collection) =>
        collection.id === id,
    );

  const next = {
    ...data,
    collections: data.collections.map(
      (collection) =>
        collection.id === id
          ? {
              ...collection,
              notes,
            }
          : collection,
    ),
  };

  log(
    next,
    "UPDATE",
    "collection",
    id,
    before,
    {
      ...before,
      notes,
    },
  );

  commit(next);
}

/* ---------- Expenses ---------- */

export function addExpense(
  input: Omit<Expense, "id">,
): Expense {
  const expense: Expense = {
    ...input,
    id: uid("exp"),
  };

  const next = {
    ...data,
    expenses: [
      ...data.expenses,
      expense,
    ],
  };

  log(
    next,
    "CREATE",
    "expense",
    expense.id,
    undefined,
    expense,
  );

  notify(next, {
    type: "EXPENSE",
    title: "Expense added",
    body: `${
      expense.category
    } · ₹${expense.amount.toLocaleString(
      "en-IN",
    )}${
      expense.description
        ? ` — ${expense.description}`
        : ""
    }`,
  });

  commit(next);

  return expense;
}

export function updateExpense(
  id: string,
  patch: Partial<Expense>,
) {
  const before =
    data.expenses.find(
      (expense) =>
        expense.id === id,
    );

  const next = {
    ...data,
    expenses: data.expenses.map(
      (expense) =>
        expense.id === id
          ? {
              ...expense,
              ...patch,
            }
          : expense,
    ),
  };

  log(
    next,
    "UPDATE",
    "expense",
    id,
    before,
    {
      ...before,
      ...patch,
    },
  );

  commit(next);
}

export function voidExpense(
  id: string,
) {
  const before =
    data.expenses.find(
      (expense) =>
        expense.id === id,
    );

  const next = {
    ...data,
    expenses: data.expenses.map(
      (expense) =>
        expense.id === id
          ? {
              ...expense,
              voided: true,
            }
          : expense,
    ),
  };

  log(
    next,
    "VOID",
    "expense",
    id,
    before,
    {
      ...before,
      voided: true,
    },
  );

  commit(next);
}

/* ---------- Income ---------- */

export function addIncome(
  input: Omit<IncomeRecord, "id">,
): IncomeRecord {
  const income: IncomeRecord = {
    ...input,
    id: uid("inc"),
  };

  const next = {
    ...data,
    incomes: [
      ...data.incomes,
      income,
    ],
  };

  log(
    next,
    "CREATE",
    "income",
    income.id,
    undefined,
    income,
  );

  commit(next);

  return income;
}

export function removeIncome(
  id: string,
) {
  const before =
    data.incomes.find(
      (income) =>
        income.id === id,
    );

  const next = {
    ...data,
    incomes: data.incomes.filter(
      (income) =>
        income.id !== id,
    ),
  };

  log(
    next,
    "DELETE",
    "income",
    id,
    before,
    undefined,
  );

  commit(next);

  void deleteIncomeFromSupabase(
    id,
  ).catch((error) => {
    console.error(
      "Supabase income delete failed:",
      error,
    );
  });
}

/* ---------- Collectors / users ---------- */

export function addCollector(
  input: Omit<Collector, "id">,
): Collector {
  const collector: Collector = {
    ...input,
    id: uid("usr"),
  };

  const next = {
    ...data,
    collectors: [
      ...data.collectors,
      collector,
    ],
  };

  log(
    next,
    "CREATE",
    "collector",
    collector.id,
    undefined,
    collector,
  );

  commit(next);

  return collector;
}

export function updateCollector(
  id: string,
  patch: Partial<Collector>,
) {
  const before =
    data.collectors.find(
      (collector) =>
        collector.id === id,
    );

  const next = {
    ...data,
    collectors: data.collectors.map(
      (collector) =>
        collector.id === id
          ? {
              ...collector,
              ...patch,
            }
          : collector,
    ),
  };

  log(
    next,
    "UPDATE",
    "collector",
    id,
    before,
    {
      ...before,
      ...patch,
    },
  );

  commit(next);
}

export function setCurrentUser(
  id: string,
) {
  commit({
    ...data,
    currentUserId: id,
  });
}

export function setCurrentUserByEmail(
  email: string,
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const collector =
    data.collectors.find(
      (item) =>
        item.email
          .trim()
          .toLowerCase() ===
          normalizedEmail &&
        item.active,
    );

  if (!collector) {
    if (data.currentUserId !== "") {
      commit({
        ...data,
        currentUserId: "",
      });
    }

    return null;
  }

  if (
    data.currentUserId !==
    collector.id
  ) {
    commit({
      ...data,
      currentUserId: collector.id,
    });
  }

  return collector;
}

/* ---------- Notifications & settings ---------- */

export function pushNotification(
  n: Omit<
    AppNotification,
    "id" | "date" | "read"
  >,
) {
  const next = {
    ...data,
  };

  notify(next, n);

  commit(next);
}

export function markAllNotificationsRead() {
  commit({
    ...data,
    notifications:
      data.notifications.map(
        (notification) => ({
          ...notification,
          read: true,
        }),
      ),
  });
}

export function updateMandal(
  patch: Partial<Mandal>,
) {
  const next = {
    ...data,
    mandal: {
      ...data.mandal,
      ...patch,
    },
  };

  log(
    next,
    "UPDATE",
    "mandal",
    data.mandal.id,
    data.mandal,
    next.mandal,
  );

  commit(next);
}