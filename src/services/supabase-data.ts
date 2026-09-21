import { supabase } from "@/lib/supabase";
import type {
  AppData,
  AppNotification,
  AuditLog,
  Building,
  Collection,
  Collector,
  Expense,
  Household,
  IncomeRecord,
  Mandal,
  Wing,
  UserRole,
} from "@/types";

/* =========================================================
   ROW CONVERTERS
   ========================================================= */

function mandalToRow(mandal: Mandal) {
  return {
    id: mandal.id,
    name: mandal.name,
    name_marathi: mandal.nameMarathi,
    address: mandal.address,
    phone: mandal.phone,
    year: mandal.year,
    default_vargani_amount: mandal.defaultVarganiAmount,
    pauti_prefix: mandal.pautiPrefix,
    receipt_footer: mandal.receiptFooter,
    language: mandal.language,
    currency: mandal.currency,
  };
}

function rowToMandal(row: any): Mandal {
  return {
    id: row.id,
    name: row.name,
    nameMarathi: row.name_marathi ?? "",
    address: row.address ?? "",
    phone: row.phone ?? "",
    year: row.year,
    defaultVarganiAmount: Number(
      row.default_vargani_amount ?? 0,
    ),
    pautiPrefix: row.pauti_prefix ?? "GM",
    receiptFooter: row.receipt_footer ?? "",
    language: row.language === "mr" ? "mr" : "en",
    currency: row.currency ?? "INR",
  };
}

function buildingToRow(
  building: Building,
  mandalId: string,
) {
  return {
    id: building.id,
    mandal_id: mandalId,
    name: building.name,
  };
}

function rowToBuilding(row: any): Building {
  return {
    id: row.id,
    name: row.name,
  };
}

function wingToRow(wing: Wing) {
  return {
    id: wing.id,
    building_id: wing.buildingId,
    name: wing.name,
  };
}

function rowToWing(row: any): Wing {
  return {
    id: row.id,
    buildingId: row.building_id,
    name: row.name,
  };
}

function householdToRow(
  household: Household,
) {
  return {
    id: household.id,
    building_id: household.buildingId,
    wing_id: household.wingId,
    floor: household.floor,
    flat_no: household.flatNo,
    resident_name: household.residentName,
    mobile: household.mobile,
    alt_mobile: household.altMobile ?? null,
    expected_amount: household.expectedAmount,
    previous_year_amount:
      household.previousYearAmount,
    exempt: household.exempt,
    notes: household.notes ?? null,
    collector_id: household.collectorId ?? null,
    archived: household.archived ?? false,
  };
}

function rowToHousehold(row: any): Household {
  return {
    id: row.id,
    buildingId: row.building_id,
    wingId: row.wing_id,
    floor: row.floor,
    flatNo: row.flat_no,
    residentName: row.resident_name,
    mobile: row.mobile ?? "",
    altMobile: row.alt_mobile ?? undefined,
    expectedAmount: Number(
      row.expected_amount ?? 0,
    ),
    previousYearAmount: Number(
      row.previous_year_amount ?? 0,
    ),
    exempt: row.exempt ?? false,
    notes: row.notes ?? undefined,
    collectorId:
      row.collector_id ?? undefined,
    archived: row.archived ?? false,
  };
}

function collectorToRow(
  collector: Collector,
) {
  return {
    id: collector.id,
    name: collector.name,
    mobile: collector.mobile,
    email: collector.email,
    role: collector.role,
    active: collector.active,
    wing_ids: collector.wingIds,
    auth_user_id:
      collector.authUserId ?? null,
  };
}

function rowToCollector(row: any): Collector {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile ?? "",
    email: row.email ?? "",
    role: row.role,
    active: row.active ?? true,
    wingIds: Array.isArray(row.wing_ids)
      ? row.wing_ids
      : [],
    authUserId:
      row.auth_user_id ?? undefined,
  };
}

function collectionToRow(
  collection: Collection,
) {
  return {
    id: collection.id,
    pauti_no: collection.pautiNo,
    household_id: collection.householdId,
    amount: collection.amount,
    method: collection.method,
    collector_id: collection.collectorId,
    date: collection.date,
    notes: collection.notes ?? null,
    voided: collection.voided ?? false,
    void_reason:
      collection.voidReason ?? null,
  };
}

function rowToCollection(
  row: any,
): Collection {
  return {
    id: row.id,
    pautiNo: row.pauti_no,
    householdId: row.household_id,
    amount: Number(row.amount ?? 0),
    method: row.method,
    collectorId: row.collector_id,
    date: row.date,
    notes: row.notes ?? undefined,
    voided: row.voided ?? false,
    voidReason:
      row.void_reason ?? undefined,
  };
}

function expenseToRow(
  expense: Expense,
) {
  return {
    id: expense.id,
    category: expense.category,
    description: expense.description ?? "",
    amount: expense.amount,
    method: expense.method,
    date: expense.date,
    paid_to: expense.paidTo,
    notes: expense.notes ?? null,
    attachment: expense.attachment ?? null,
    voided: expense.voided ?? false,
  };
}

function rowToExpense(row: any): Expense {
  return {
    id: row.id,
    category: row.category,
    description: row.description ?? "",
    amount: Number(row.amount ?? 0),
    method: row.method,
    date: row.date,
    paidTo: row.paid_to ?? "",
    notes: row.notes ?? undefined,
    attachment:
      row.attachment ?? undefined,
    voided: row.voided ?? false,
  };
}

function incomeToRow(
  income: IncomeRecord,
) {
  return {
    id: income.id,
    source: income.source,
    from_name: income.from,
    amount: income.amount,
    method: income.method,
    date: income.date,
    notes: income.notes ?? null,
  };
}

function rowToIncome(row: any): IncomeRecord {
  return {
    id: row.id,
    source: row.source,
    from: row.from_name,
    amount: Number(row.amount ?? 0),
    method: row.method,
    date: row.date,
    notes: row.notes ?? undefined,
  };
}

function notificationToRow(
  notification: AppNotification,
) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    date: notification.date,
    read: notification.read,
  };
}

function rowToNotification(
  row: any,
): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    date: row.date,
    read: row.read ?? false,
  };
}

function auditToRow(log: AuditLog) {
  return {
    id: log.id,
    user_id: log.userId,
    action: log.action,
    entity: log.entity,
    entity_id: log.entityId,
    before_data: log.before
      ? JSON.parse(log.before)
      : null,
    after_data: log.after
      ? JSON.parse(log.after)
      : null,
    date: log.date,
  };
}

function rowToAudit(
  row: any,
): AuditLog {
  return {
    id: row.id,
    userId: row.user_id ?? "",
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    before: row.before_data
      ? JSON.stringify(row.before_data)
      : undefined,
    after: row.after_data
      ? JSON.stringify(row.after_data)
      : undefined,
    date: row.date,
  };
}

/* =========================================================
   CURRENT USER HELPERS
   ========================================================= */

async function getCurrentRole(): Promise<UserRole | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to get current user role:",
      error,
    );

    return null;
  }

  return data?.role ?? null;
}

async function getCurrentCollectorId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const {
    data,
    error,
  } = await supabase
    .from("collectors")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to get current collector:",
      error,
    );

    return null;
  }

  return data?.id ?? null;
}

/* =========================================================
   LOAD APP DATA
   ========================================================= */

export async function loadAppData(
  fallback: AppData,
): Promise<AppData | null> {
  const [
    mandals,
    buildings,
    wings,
    households,
    collectors,
    collections,
    expenses,
    incomes,
    notifications,
    auditLogs,
  ] = await Promise.all([
    supabase
      .from("mandals")
      .select("*")
      .limit(1),

    supabase
      .from("buildings")
      .select("*"),

    supabase
      .from("wings")
      .select("*"),

    supabase
      .from("households")
      .select("*"),

    supabase
      .from("collectors")
      .select("*"),

    supabase
      .from("collections")
      .select("*"),

    supabase
      .from("expenses")
      .select("*"),

    supabase
      .from("incomes")
      .select("*"),

    supabase
      .from("notifications")
      .select("*")
      .order("date", {
        ascending: false,
      }),

    supabase
      .from("audit_logs")
      .select("*")
      .order("date", {
        ascending: false,
      }),
  ]);

  const results = [
    mandals,
    buildings,
    wings,
    households,
    collectors,
    collections,
    expenses,
    incomes,
    notifications,
    auditLogs,
  ];

  const failed = results.find(
    (result) => result.error,
  );

  if (failed) {
    console.error(
      "Supabase load failed:",
      failed.error,
    );

    return null;
  }

  if (!mandals.data?.length) {
    return null;
  }

  return {
    mandal: rowToMandal(
      mandals.data[0],
    ),

    buildings: (
      buildings.data ?? []
    ).map(rowToBuilding),

    wings: (
      wings.data ?? []
    ).map(rowToWing),

    households: (
      households.data ?? []
    ).map(rowToHousehold),

    collectors: (
      collectors.data ?? []
    ).map(rowToCollector),

    collections: (
      collections.data ?? []
    ).map(rowToCollection),

    expenses: (
      expenses.data ?? []
    ).map(rowToExpense),

    incomes: (
      incomes.data ?? []
    ).map(rowToIncome),

    notifications: (
      notifications.data ?? []
    ).map(rowToNotification),

    auditLogs: (
      auditLogs.data ?? []
    ).map(rowToAudit),

    currentUserId:
      fallback.currentUserId,
  };
}

/* =========================================================
   SUPABASE REALTIME
   ========================================================= */

/**
 * Subscribe to live changes from Supabase.
 *
 * When another browser/device changes application data,
 * Supabase Realtime calls the supplied onChange callback.
 *
 * The store will then reload the latest data from Supabase.
 */
export function subscribeToRealtime(
  onChange: () => void,
) {
  const channel = supabase
    .channel("digital-vargani-realtime")

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "households",
      },
      onChange,
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "collections",
      },
      onChange,
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "expenses",
      },
      onChange,
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "incomes",
      },
      onChange,
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
      },
      onChange,
    );

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      console.log(
        "Digital Vargani: Supabase Realtime connected",
      );
    }

    if (status === "CHANNEL_ERROR") {
      console.error(
        "Digital Vargani: Supabase Realtime channel error",
      );
    }

    if (status === "TIMED_OUT") {
      console.error(
        "Digital Vargani: Supabase Realtime connection timed out",
      );
    }
  });

  return () => {
    void supabase.removeChannel(channel);
  };
}

/* =========================================================
   SAVE APP DATA
   ========================================================= */

export async function saveAppData(
  appData: AppData,
) {
  const role = await getCurrentRole();

  if (!role) {
    throw new Error(
      "Unable to determine current user role.",
    );
  }

  /* =======================================================
     SUPER ADMIN
     ======================================================= */

  if (role === "SUPER_ADMIN") {
    const mandalId =
      appData.mandal.id;

    // 1. Mandal
    {
      const { error } =
        await supabase
          .from("mandals")
          .upsert(
            mandalToRow(
              appData.mandal,
            ),
          );

      if (error) {
        console.error(
          "Failed to save mandal:",
          error,
        );
        throw error;
      }
    }

    // 2. Buildings
    {
      const { error } =
        await supabase
          .from("buildings")
          .upsert(
            appData.buildings.map(
              (building) =>
                buildingToRow(
                  building,
                  mandalId,
                ),
            ),
          );

      if (error) {
        console.error(
          "Failed to save buildings:",
          error,
        );
        throw error;
      }
    }

    // 3. Wings
    {
      const { error } =
        await supabase
          .from("wings")
          .upsert(
            appData.wings.map(
              wingToRow,
            ),
          );

      if (error) {
        console.error(
          "Failed to save wings:",
          error,
        );
        throw error;
      }
    }

    // 4. Collectors
    {
      const { error } =
        await supabase
          .from("collectors")
          .upsert(
            appData.collectors.map(
              collectorToRow,
            ),
          );

      if (error) {
        console.error(
          "Failed to save collectors:",
          error,
        );
        throw error;
      }
    }

    // 5. Households
    {
      const { error } =
        await supabase
          .from("households")
          .upsert(
            appData.households.map(
              householdToRow,
            ),
          );

      if (error) {
        console.error(
          "Failed to save households:",
          error,
        );
        throw error;
      }
    }

    // 6. Collections
    {
      const { error } =
        await supabase
          .from("collections")
          .upsert(
            appData.collections.map(
              collectionToRow,
            ),
          );

      if (error) {
        console.error(
          "Failed to save collections:",
          error,
        );
        throw error;
      }
    }

    // 7. Expenses
    {
      const { error } =
        await supabase
          .from("expenses")
          .upsert(
            appData.expenses.map(
              expenseToRow,
            ),
          );

      if (error) {
        console.error(
          "Failed to save expenses:",
          error,
        );
        throw error;
      }
    }

    // 8. Incomes
    {
      const { error } =
        await supabase
          .from("incomes")
          .upsert(
            appData.incomes.map(
              incomeToRow,
            ),
          );

      if (error) {
        console.error(
          "Failed to save incomes:",
          error,
        );
        throw error;
      }
    }

    // 9. Notifications
    {
      const { error } =
        await supabase
          .from("notifications")
          .upsert(
            appData.notifications.map(
              notificationToRow,
            ),
          );

      if (error) {
        console.error(
          "Failed to save notifications:",
          error,
        );
        throw error;
      }
    }

    // 10. Audit logs
    {
      const { error } =
        await supabase
          .from("audit_logs")
          .upsert(
            appData.auditLogs.map(
              auditToRow,
            ),
          );

      if (error) {
        console.error(
          "Failed to save audit logs:",
          error,
        );
        throw error;
      }
    }

    console.log(
      "Digital Vargani: admin data saved to Supabase",
    );

    return;
  }

  /* =======================================================
     COLLECTOR
     ======================================================= */

  if (role === "COLLECTOR") {
    const collectorId =
      await getCurrentCollectorId();

    if (!collectorId) {
      throw new Error(
        "Collector account is not linked.",
      );
    }

    /* -------------------------------------------------------
       1. SAVE NEW HOUSEHOLDS
       ------------------------------------------------------- */

    const collectorHouseholds =
      appData.households.filter(
        (household) =>
          household.collectorId ===
            collectorId &&
          !household.archived,
      );

    for (
      const household of
      collectorHouseholds
    ) {
      const {
        data: existingHousehold,
        error: existingError,
      } = await supabase
        .from("households")
        .select("id")
        .eq("id", household.id)
        .maybeSingle();

      if (existingError) {
        console.error(
          "Failed to check collector household:",
          existingError,
        );

        throw existingError;
      }

      /**
       * Insert only if it doesn't already exist.
       *
       * This makes each household independently
       * durable before its collection is saved.
       */
      if (!existingHousehold) {
        const { error } =
          await supabase
            .from("households")
            .insert(
              householdToRow(
                household,
              ),
            );

        if (error) {
          console.error(
            "Failed to save collector household:",
            household,
            error,
          );

          throw error;
        }

        console.log(
          "Digital Vargani: saved collector household",
          household.id,
        );
      }
    }

    /* -------------------------------------------------------
       2. SAVE COLLECTIONS
       ------------------------------------------------------- */

    const collectorCollections =
      appData.collections.filter(
        (collection) =>
          collection.collectorId ===
          collectorId,
      );

    for (
      const collection of
      collectorCollections
    ) {
      /**
       * Confirm the household exists remotely
       * before attempting the foreign-key insert.
       */
      const {
        data: household,
        error: householdError,
      } = await supabase
        .from("households")
        .select("id")
        .eq(
          "id",
          collection.householdId,
        )
        .maybeSingle();

      if (householdError) {
        console.error(
          "Failed to verify collection household:",
          collection.pautiNo,
          householdError,
        );

        throw householdError;
      }

      if (!household) {
        const localHousehold =
          appData.households.find(
            (item) =>
              item.id ===
              collection.householdId,
          );

        if (localHousehold) {
          const {
            error:
              householdInsertError,
          } = await supabase
            .from("households")
            .upsert(
              householdToRow(
                localHousehold,
              ),
            );

          if (
            householdInsertError
          ) {
            console.error(
              "Failed to restore collection household:",
              localHousehold,
              householdInsertError,
            );

            throw householdInsertError;
          }
        } else {
          throw new Error(
            `Household ${collection.householdId} does not exist for collection ${collection.pautiNo}.`,
          );
        }
      }

      const { error } =
        await supabase
          .from("collections")
          .upsert(
            collectionToRow(
              collection,
            ),
          );

      if (error) {
        console.error(
          "Failed to save collector collection:",
          collection.pautiNo,
          error,
        );

        throw error;
      }
    }

    /* -------------------------------------------------------
       3. SAVE EXPENSES
       ------------------------------------------------------- */

    {
      const { error } =
        await supabase
          .from("expenses")
          .upsert(
            appData.expenses.map(
              expenseToRow,
            ),
          );

      if (error) {
        console.error(
          "Failed to save collector expenses:",
          error,
        );

        throw error;
      }
    }

    console.log(
      "Digital Vargani: collector data saved to Supabase",
    );

    return;
  }

  /* =======================================================
     VIEWER
     ======================================================= */

  if (role === "VIEWER") {
    return;
  }
}

/* =========================================================
   DELETE INCOME
   ========================================================= */

export async function deleteIncome(
  id: string,
) {
  const { error } =
    await supabasesee 
      .from("incomes")
      .delete()
      .eq("id", id);

  if (error) {
    throw error;
  }
}