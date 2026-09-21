export type PaymentMethod = "UPI" | "CASH" | "BANK" | "CHEQUE";
export type HouseholdStatus = "PAID" | "PARTIAL" | "PENDING" | "EXEMPT";
export type UserRole = "SUPER_ADMIN" | "COLLECTOR" | "VIEWER";
export type IncomeSource = "SPONSORSHIP" | "OTHER";

export interface Collector {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: UserRole;
  active: boolean;
  wingIds: string[];
  authUserId?: string;
}

export interface Building {
  id: string;
  name: string;
}

export interface Wing {
  id: string;
  buildingId: string;
  name: string;
}

export interface Household {
  id: string;
  buildingId: string;
  wingId: string;
  floor: number;
  flatNo: string;
  residentName: string;
  mobile: string;
  altMobile?: string | undefined;
  expectedAmount: number;
  previousYearAmount: number;
  exempt: boolean;
  notes?: string | undefined;
  collectorId?: string | undefined;
  archived?: boolean | undefined;
}

export interface Collector {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: UserRole;
  active: boolean;
  wingIds: string[];
}

export interface Collection {
  id: string;
  pautiNo: string;
  householdId: string;
  amount: number;
  method: PaymentMethod;
  collectorId: string;
  date: string; // ISO
  notes?: string | undefined;
  voided?: boolean | undefined;
  voidReason?: string | undefined;
}

export interface ExpenseAttachment {
  name: string;
  type: string;
  dataUrl: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  paidTo: string;
  notes?: string | undefined;
  attachment?: ExpenseAttachment | undefined;
  voided?: boolean | undefined;
}

export interface IncomeRecord {
  id: string;
  source: IncomeSource;
  from: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string | undefined;
}

export interface AppNotification {
  id: string;
  type: "COLLECTION" | "EXPENSE" | "REMINDER" | "PAUTI";
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: string | undefined;
  after?: string | undefined;
  date: string;
}

export interface AppData {
  mandal: Mandal;
  buildings: Building[];
  wings: Wing[];
  households: Household[];
  collectors: Collector[];
  collections: Collection[];
  expenses: Expense[];
  incomes: IncomeRecord[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
  currentUserId: string;
}

export const EXPENSE_CATEGORIES = [
  "Decoration",
  "Mandap",
  "Lighting",
  "Sound System",
  "Prasad",
  "Puja Material",
  "Visarjan",
  "Transport",
  "Security",
  "Printing",
  "Electricity",
  "Cleaning",
  "Entertainment",
  "Other",
] as const;

export const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "CASH", "BANK", "CHEQUE"];
