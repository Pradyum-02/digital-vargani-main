import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
  updateCollector,
  useAppData,
} from "@/services/store";

import { collectorPerformance } from "@/services/selectors";

import {
  formatINR,
  formatNumber,
} from "@/lib/format";

import {
  EmptyState,
  PageHeader,
  ProgressBar,
  SectionCard,
  StatCard,
} from "@/components/app/ui-bits";

import type {
  Collector,
  UserRole,
} from "@/types";

import { useAuth } from "@/services/auth";
import { supabase } from "@/lib/supabase";

const ROLES: UserRole[] = [
  "COLLECTOR",
  "VIEWER",
];

const ROLE_LABEL: Record<
  UserRole,
  string
> = {
  SUPER_ADMIN: "Super Admin",
  COLLECTOR: "Collector",
  VIEWER: "Viewer",
};

export const Route = createFileRoute(
  "/collectors",
)({
  head: () => ({
    meta: [
      {
        title:
          "Collectors & Team — Digital Vargani",
      },
      {
        name: "description",
        content:
          "Manage Mandal volunteers, assign wings and track collector-wise Vargani performance.",
      },
      {
        property: "og:title",
        content:
          "Collectors & Team — Digital Vargani",
      },
      {
        property: "og:description",
        content:
          "Volunteer roles, wing assignments and daily collection totals.",
      },
    ],
  }),

  component: CollectorsPage,
});

function CollectorsPage() {
  const data = useAppData();
  const { profile } = useAuth();

  const isSuperAdmin =
    profile?.role === "SUPER_ADMIN";

  const perf = useMemo(
    () => collectorPerformance(data),
    [data],
  );

  const perfById = new Map(
    perf.map((p) => [p.id, p]),
  );

  const [editing, setEditing] =
    useState<Collector | null>(null);

  const [addOpen, setAddOpen] =
    useState(false);

  const topAmount = Math.max(
    1,
    ...perf.map((p) => p.amount),
  );

  const totalToday = perf.reduce(
    (s, p) => s + p.todayAmount,
    0,
  );

  /*
   * The route is already protected by RoleGuard,
   * but this additional check prevents actions from
   * being triggered by non-admin users.
   */
  if (!isSuperAdmin) {
    return (
      <SectionCard
        title="Access denied"
        marathi="प्रवेश नाकारला"
        className="mt-4"
      >
        <p className="text-sm text-muted-foreground">
          Only Super Admins can manage team
          members.
        </p>
      </SectionCard>
    );
  }

  return (
    <>
      <PageHeader
        title="Collectors"
        marathi="कार्यकर्ते"
        description={`${data.collectors.length} team members · ${formatINR(totalToday)} collected today`}
        actions={
          <Button
            onClick={() =>
              setAddOpen(true)
            }
          >
            <Plus className="h-4 w-4" />
            Add member
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Team Members"
          value={formatNumber(
            data.collectors.length,
          )}
          tone="primary"
        />

        <StatCard
          label="Active Collectors"
          value={formatNumber(
            perf.length,
          )}
        />

        <StatCard
          label="Collected Today"
          value={formatINR(
            totalToday,
          )}
          tone="success"
        />

        <StatCard
          label="Top Collector"
          value={
            perf
              .slice()
              .sort(
                (a, b) =>
                  b.amount - a.amount,
              )[0]?.name ?? "—"
          }
        />
      </div>

      <SectionCard
        title="Performance"
        marathi="कामगिरी"
        className="mt-4"
      >
        {perf.length === 0 ? (
          <EmptyState
            icon={
              <Users className="h-8 w-8" />
            }
            title="No collectors yet"
            description="Add volunteers to assign wings and track their Vargani collection."
            action={
              <Button
                onClick={() =>
                  setAddOpen(true)
                }
              >
                Add first member
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {perf
              .slice()
              .sort(
                (a, b) =>
                  b.amount - a.amount,
              )
              .map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {p.name}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {
                          p.collectedHouseholds
                        }
                        /
                        {p.assigned}{" "}
                        households ·{" "}
                        {
                          p.pendingHouseholds
                        }{" "}
                        pending
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="num font-bold">
                        {formatINR(
                          p.amount,
                        )}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Today{" "}
                        {formatINR(
                          p.todayAmount,
                        )}{" "}
                        · UPI{" "}
                        {formatINR(
                          p.upi,
                        )}{" "}
                        · Cash{" "}
                        {formatINR(
                          p.cash,
                        )}
                      </p>
                    </div>
                  </div>

                  <ProgressBar
                    percent={Math.round(
                      (p.amount /
                        topAmount) *
                        100,
                    )}
                  />
                </div>
              ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Team members"
        marathi="टीम"
        className="mt-4"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.collectors.map((c) => {
            const p =
              perfById.get(c.id);

            return (
              <div
                key={c.id}
                className="rounded-xl border p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {c.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABEL[c.role]} ·{" "}
                      {c.mobile}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.email}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      c.active
                        ? "border-success/25 bg-success/12 text-success"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {c.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Wings:{" "}
                  {c.wingIds.length
                    ? c.wingIds
                        .map(
                          (w) =>
                            data.wings.find(
                              (x) =>
                                x.id === w,
                            )?.name ??
                            w,
                        )
                        .join(", ")
                    : "All"}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {c.authUserId
                    ? "✓ Login account linked"
                    : "⚠ No login account linked"}
                </p>

                {p ? (
                  <p className="num mt-1 text-sm font-semibold">
                    {formatINR(
                      p.amount,
                    )}{" "}
                    collected
                  </p>
                ) : null}

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setEditing(c)
                    }
                  >
                    Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <Link
                      to="/collections"
                      search={{
                        collector: c.id,
                      }}
                    >
                      View collections
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <CollectorDialog
        key={editing?.id ?? "new"}
        collector={editing}
        open={
          addOpen ||
          editing !== null
        }
        onOpenChange={(v) => {
          if (!v) {
            setAddOpen(false);
            setEditing(null);
          }
        }}
      />
    </>
  );
}

function CollectorDialog({
  collector,
  open,
  onOpenChange,
}: {
  collector: Collector | null;
  open: boolean;
  onOpenChange: (
    v: boolean,
  ) => void;
}) {
  const data = useAppData();
  const { profile } = useAuth();

  const isSuperAdmin =
    profile?.role === "SUPER_ADMIN";

  const [name, setName] =
    useState(
      collector?.name ?? "",
    );

  const [mobile, setMobile] =
    useState(
      collector?.mobile ?? "",
    );

  const [email, setEmail] =
    useState(
      collector?.email ?? "",
    );

  const [role, setRole] =
    useState<UserRole>(
      collector?.role ===
        "VIEWER"
        ? "VIEWER"
        : "COLLECTOR",
    );

  const [active, setActive] =
    useState(
      collector?.active ?? true,
    );

  const [wingIds, setWingIds] =
    useState<string[]>(
      collector?.wingIds ?? [],
    );

  const [saving, setSaving] =
    useState(false);

  const toggleWing = (
    id: string,
  ) =>
    setWingIds((prev) =>
      prev.includes(id)
        ? prev.filter(
            (w) => w !== id,
          )
        : [...prev, id],
    );

  const resetForm = () => {
    setName("");
    setMobile("");
    setEmail("");
    setRole("COLLECTOR");
    setActive(true);
    setWingIds([]);
  };

  const submit = async () => {
    if (!isSuperAdmin) {
      toast.error(
        "Only Super Admins can manage team members.",
      );
      return;
    }

    if (!name.trim()) {
      toast.error(
        "Name is required",
      );
      return;
    }

    const cleanMobile =
      mobile.replace(/\D/g, "");

    if (
      !/^\d{10}$/.test(
        cleanMobile,
      )
    ) {
      toast.error(
        "Enter a valid 10-digit mobile number",
      );
      return;
    }

    const cleanEmail =
      email.trim().toLowerCase();

    if (
      !cleanEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail,
      )
    ) {
      toast.error(
        "Enter a valid email address",
      );
      return;
    }

    /*
     * EDIT EXISTING MEMBER
     *
     * Existing accounts continue to use the
     * normal store update flow.
     */
    if (collector) {
      setSaving(true);

      try {
        updateCollector(
          collector.id,
          {
            name: name.trim(),
            mobile: cleanMobile,
            email: cleanEmail,
            role,
            active,
            wingIds,
          },
        );

        toast.success(
          "Member updated",
        );

        onOpenChange(false);
      } catch {
        toast.error(
          "Unable to update member.",
        );
      } finally {
        setSaving(false);
      }

      return;
    }

    /*
     * CREATE NEW LOGIN
     *
     * We do NOT call addCollector().
     *
     * The Edge Function:
     * 1. Verifies SUPER_ADMIN
     * 2. Creates Supabase Auth user
     * 3. Sends invitation email
     * 4. Creates profile
     * 5. Creates collector record
     */
    setSaving(true);

    try {
      const {
        data: result,
        error,
      } =
        await supabase.functions.invoke(
          "create-team-account",
          {
            body: {
              name: name.trim(),
              mobile: cleanMobile,
              email: cleanEmail,
              role:
                role === "VIEWER"
                  ? "VIEWER"
                  : "COLLECTOR",
              active,
              wingIds,
            },
          },
        );

      if (error) {
        throw new Error(
          error.message ||
            "Unable to create team account.",
        );
      }

      if (
        !result ||
        result.success !== true
      ) {
        throw new Error(
          result?.error ||
            "Unable to create team account.",
        );
      }

      toast.success(
        "Account created! Invitation email sent.",
      );

      onOpenChange(false);
      resetForm();

      /*
       * The Edge Function created the exact
       * database record. Reloading forces the app
       * to hydrate the new record from Supabase.
       */
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create the team account.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open && isSuperAdmin}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {collector
              ? "Edit member"
              : "Create team account"}
          </DialogTitle>
        </DialogHeader>

        {!collector ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm font-medium">
              Login invitation
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              An invitation email will be sent to
              this address. The team member will set
              their own password.
            </p>
          </div>
        ) : null}

        <div className="grid gap-3">
          <div>
            <Label>
              Name
            </Label>

            <Input
              className="mt-1"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value,
                )
              }
              placeholder="Collector name"
              disabled={saving}
            />
          </div>

          <div>
            <Label>
              Mobile
            </Label>

            <Input
              className="num mt-1"
              inputMode="numeric"
              value={mobile}
              onChange={(e) =>
                setMobile(
                  e.target.value,
                )
              }
              placeholder="10-digit mobile number"
              disabled={saving}
            />
          </div>

          <div>
            <Label>
              Email
            </Label>

            <Input
              className="mt-1"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value,
                )
              }
              placeholder="collector@gmail.com"
              disabled={
                saving ||
                !!collector
              }
            />

            {collector ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Login email cannot be changed
                from this screen.
              </p>
            ) : null}
          </div>

          <div>
            <Label>
              Role
            </Label>

            <Select
              value={role}
              onValueChange={(v) =>
                setRole(
                  v as UserRole,
                )
              }
              disabled={saving}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem
                    key={r}
                    value={r}
                  >
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!collector ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Super Admin accounts are managed
                separately.
              </p>
            ) : null}
          </div>

          <div>
            <Label>
              Assigned wings
            </Label>

            <div className="mt-1 flex flex-wrap gap-2">
              {data.wings.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    toggleWing(w.id)
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    wingIds.includes(
                      w.id,
                    )
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {data.buildings.find(
                    (b) =>
                      b.id ===
                      w.buildingId,
                  )?.name ?? ""}{" "}
                  · Wing {w.name}
                </button>
              ))}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Select the wings this collector is
              responsible for.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">
                Active
              </p>

              <p className="text-xs text-muted-foreground">
                Inactive members cannot record
                collections.
              </p>
            </div>

            <Switch
              checked={active}
              onCheckedChange={
                setActive
              }
              disabled={saving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            onClick={submit}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                {collector
                  ? "Saving…"
                  : "Creating account…"}
              </>
            ) : collector ? (
              "Save changes"
            ) : (
              "Create account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}