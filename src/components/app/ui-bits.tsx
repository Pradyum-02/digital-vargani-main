import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import type { HouseholdStatus, PaymentMethod } from "@/types";

export function PageHeader({
  title,
  marathi,
  description,
  actions,
}: {
  title: string;
  marathi?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
          {marathi ? (
            <span className="deva ml-2 text-lg font-medium text-muted-foreground">{marathi}</span>
          ) : null}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionCard({
  title,
  marathi,
  action,
  children,
  className,
}: {
  title: string;
  marathi?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-card", className)}>
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          {title}
          {marathi ? <span className="deva ml-2 normal-case">{marathi}</span> : null}
        </h2>
        {action}
      </header>

      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

const TONES = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-destructive text-destructive-foreground",
  info: "bg-info text-info-foreground",
  upi: "bg-upi text-success-foreground",
  cash: "bg-cash text-warning-foreground",
  bank: "bg-bank text-info-foreground",
  cheque: "bg-cheque text-primary-foreground",
  plain: "bg-card text-card-foreground border",
} as const;

export type Tone = keyof typeof TONES;

export function StatCard({
  label,
  marathi,
  value,
  sub,
  tone = "plain",
  icon,
}: {
  label: string;
  marathi?: string;
  value: string;
  sub?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl p-4 shadow-card sm:p-5", TONES[tone])}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-widest uppercase opacity-85">{label}</p>
        {icon ? <span className="opacity-90">{icon}</span> : null}
      </div>
      <p className="num mt-3 text-2xl font-bold sm:text-[28px]">{value}</p>
      {marathi ? <p className="deva text-xs opacity-80">{marathi}</p> : null}
      {sub ? <p className="mt-1 text-xs opacity-85">{sub}</p> : null}
    </div>
  );
}

export function MoneyCell({ amount, className }: { amount: number; className?: string }) {
  return <span className={cn("num font-semibold", className)}>{formatINR(amount)}</span>;
}

export function StatusBadge({ status }: { status: HouseholdStatus | "VOID" }) {
  const map: Record<string, string> = {
    PAID: "bg-success/12 text-success border-success/25",
    PARTIAL: "bg-warning/15 text-warning-foreground border-warning/40",
    PENDING: "bg-destructive/10 text-destructive border-destructive/25",
    EXEMPT: "bg-muted text-muted-foreground border-border",
    VOID: "bg-muted text-muted-foreground border-border line-through",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        map[status],
      )}
    >
      {status}
    </span>
  );
}

export function MethodBadge({ method }: { method: PaymentMethod }) {
  const map: Record<PaymentMethod, string> = {
    UPI: "bg-upi/12 text-upi border-upi/25",
    CASH: "bg-cash/15 text-warning-foreground border-cash/40",
    BANK: "bg-bank/12 text-bank border-bank/25",
    CHEQUE: "bg-cheque/12 text-cheque border-cheque/25",
  };
  const label = method === "BANK" ? "Bank" : method === "CHEQUE" ? "Cheque" : method === "CASH" ? "Cash" : "UPI";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        map[method],
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ProgressBar({ percent, tone = "primary" }: { percent: number; tone?: Tone }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full transition-all", TONES[tone])}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
