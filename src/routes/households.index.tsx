import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, Search, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAppData } from "@/services/store";
import { useAuth } from "@/services/auth";
import {
  currentUser,
  householdSummaries,
  visibleHouseholds,
} from "@/services/selectors";

import { formatINR } from "@/lib/format";

import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/app/ui-bits";

import { CollectDialog } from "@/components/app/CollectDialog";

type Search = {
  q?: string;
  status?: string;
  building?: string;
  wing?: string;
};

export const Route = createFileRoute("/households/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search.q === "string" ? search.q : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
    building:
      typeof search.building === "string" ? search.building : undefined,
    wing: typeof search.wing === "string" ? search.wing : undefined,
  }),

  head: () => ({
    meta: [
      {
        title: "Houses & Flats — Digital Vargani",
      },
      {
        name: "description",
        content:
          "Manage buildings, wings and flats, expected Vargani, payment status and assigned collectors.",
      },
      {
        property: "og:title",
        content: "Houses & Flats — Digital Vargani",
      },
      {
        property: "og:description",
        content:
          "Every household with expected Vargani, paid amount, remaining and status.",
      },
    ],
  }),

  component: HouseholdsPage,
});

function HouseholdsPage() {
  const data = useAppData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const localUser = currentUser(data);
  const { profile } = useAuth();

  const role = profile?.role ?? localUser?.role;

  const [collectFor, setCollectFor] = useState<string | null>(null);
  const [collectOpen, setCollectOpen] = useState(false);

  const summaries = useMemo(() => {
    const allSummaries = householdSummaries(data);

    if (profile?.role === "COLLECTOR") {
      return visibleHouseholds(data, allSummaries);
    }

    return allSummaries;
  }, [data, profile?.role]);

  const q = (search.q ?? "").trim().toLowerCase();

  const filtered = summaries.filter((summary) => {
    const household = summary.household;

    if (
      q &&
      ![
        household.flatNo,
        household.residentName,
        household.mobile,
        summary.collectorName,
      ].some((value) => value.toLowerCase().includes(q))
    ) {
      return false;
    }

    if (
      search.status &&
      search.status !== "ALL" &&
      summary.status !== search.status
    ) {
      return false;
    }

    if (
      search.building &&
      search.building !== "ALL" &&
      household.buildingId !== search.building
    ) {
      return false;
    }

    if (
      search.wing &&
      search.wing !== "ALL" &&
      household.wingId !== search.wing
    ) {
      return false;
    }

    return true;
  });

  const setSearch = (patch: Search) => {
    navigate({
      search: (previous) => ({
        ...previous,
        ...patch,
      }),
      replace: true,
    });
  };

  const wings = data.wings.filter(
    (wing) =>
      !search.building ||
      search.building === "ALL" ||
      wing.buildingId === search.building,
  );

  return (
    <>
      <PageHeader
        title="Houses / Flats"
        marathi="घर / फ्लॅट"
        description={`${filtered.length} of ${summaries.length} households${
          role === "COLLECTOR" ? " assigned to you" : ""
        }`}
        actions={
          <div className="flex flex-wrap gap-2">
            {role !== "VIEWER" ? (
              <Button
                onClick={() => {
                  setCollectFor(null);
                  setCollectOpen(true);
                }}
              >
                <Receipt className="h-4 w-4" />
                Collect Vargani
              </Button>
            ) : null}
          </div>
        }
      />

      <SectionCard title="Filters" className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />

            <Input
              className="pl-9"
              placeholder="Flat, resident, mobile…"
              value={search.q ?? ""}
              onChange={(event) =>
                setSearch({
                  q: event.target.value || undefined,
                })
              }
            />
          </div>

          <Select
            value={search.building ?? "ALL"}
            onValueChange={(value) =>
              setSearch({
                building: value,
                wing: "ALL",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Building" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All buildings</SelectItem>

              {data.buildings.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={search.wing ?? "ALL"}
            onValueChange={(value) =>
              setSearch({
                wing: value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Wing" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="ALL">All wings</SelectItem>

              {wings.map((wing) => (
                <SelectItem key={wing.id} value={wing.id}>
                  Wing {wing.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={search.status ?? "ALL"}
            onValueChange={(value) =>
              setSearch({
                status: value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>

            <SelectContent>
              {["ALL", "PAID", "PARTIAL", "PENDING", "EXEMPT"].map(
                (status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No households registered yet"
          description={
            role === "VIEWER"
              ? "No households have been registered yet."
              : "Reach a door, enter the household details and collect Vargani in one step."
          }
          actions={
            role !== "VIEWER" ? (
              <Button
                onClick={() => {
                  setCollectFor(null);
                  setCollectOpen(true);
                }}
              >
                <Receipt className="h-4 w-4" />
                Collect Vargani
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-2 md:hidden">
          {filtered.slice(0, 120).map((summary) => (
            <div
              key={summary.household.id}
              className="rounded-xl border bg-card p-3 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    to="/households/$id"
                    params={{ id: summary.household.id }}
                    className="font-bold hover:text-primary"
                  >
                    {summary.household.flatNo}
                  </Link>

                  <p className="truncate text-xs text-muted-foreground">
                    {summary.household.residentName} ·{" "}
                    {summary.household.mobile}
                  </p>
                </div>

                <StatusBadge status={summary.status} />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Paid{" "}
                  <b className="num text-foreground">
                    {formatINR(summary.paid)}
                  </b>{" "}
                  / {formatINR(summary.household.expectedAmount)}
                </span>

                {summary.status !== "PAID" &&
                summary.status !== "EXEMPT" ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setCollectFor(summary.household.id);
                      setCollectOpen(true);
                    }}
                  >
                    <Receipt className="h-4 w-4" />
                    Collect
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-card md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Flat</th>
                <th className="px-4 py-3">Resident</th>
                <th className="px-4 py-3">Wing</th>
                <th className="px-4 py-3 text-right">Expected</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Collector</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {filtered.slice(0, 200).map((summary) => (
                <tr
                  key={summary.household.id}
                  className="border-t hover:bg-muted/40"
                >
                  <td className="px-4 py-2.5 font-semibold">
                    <Link
                      to="/households/$id"
                      params={{ id: summary.household.id }}
                      className="hover:text-primary"
                    >
                      {summary.household.flatNo}
                    </Link>
                  </td>

                  <td className="px-4 py-2.5">
                    {summary.household.residentName}

                    <span className="block text-xs text-muted-foreground">
                      {summary.household.mobile}
                    </span>
                  </td>

                  <td className="px-4 py-2.5 text-muted-foreground">
                    {summary.buildingName} · {summary.wingName}
                  </td>

                  <td className="num px-4 py-2.5 text-right">
                    {formatINR(summary.household.expectedAmount)}
                  </td>

                  <td className="num px-4 py-2.5 text-right">
                    {formatINR(summary.paid)}
                  </td>

                  <td className="num px-4 py-2.5 text-right font-semibold">
                    {formatINR(summary.remaining)}
                  </td>

                  <td className="px-4 py-2.5">
                    <StatusBadge status={summary.status} />
                  </td>

                  <td className="px-4 py-2.5 text-muted-foreground">
                    {summary.collectorName}
                  </td>

                  <td className="px-4 py-2.5 text-right">
                    {summary.status !== "PAID" &&
                    summary.status !== "EXEMPT" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setCollectFor(summary.household.id);
                          setCollectOpen(true);
                        }}
                      >
                        <Receipt className="h-4 w-4" />
                        Collect
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" asChild>
                        <Link
                          to="/households/$id"
                          params={{ id: summary.household.id }}
                        >
                          View
                        </Link>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length > 200 ? (
            <p className="border-t px-4 py-3 text-xs text-muted-foreground">
              Showing first 200 of {filtered.length} households — refine the
              filters to narrow results.
            </p>
          ) : null}
        </div>
      ) : null}

      <CollectDialog
        householdId={collectFor}
        open={collectOpen || collectFor !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCollectOpen(false);
            setCollectFor(null);
          }
        }}
      />
    </>
  );
}