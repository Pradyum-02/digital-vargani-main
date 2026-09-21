import { RoleGuard } from "@/components/app/RoleGuard";
import {
  Link,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Bell,
  Building2,
  FileText,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Search,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  hydrateFromStorage,
  useAppData,
} from "@/services/store";

import {
  currentUser,
  householdSummaries,
} from "@/services/selectors";

import { formatINR } from "@/lib/format";
import { useAuth } from "@/services/auth";
import type { UserRole } from "@/types";

type NavItem = {
  to:
    | "/"
    | "/households"
    | "/collections"
    | "/pautis"
    | "/expenses"
    | "/hishob"
    | "/collectors"
    | "/notifications"
    | "/settings";
  label: string;
  icon: typeof LayoutDashboard;
  mobile: boolean;
  roles: UserRole[];
};

const NAV: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    mobile: true,
    roles: ["SUPER_ADMIN", "COLLECTOR", "VIEWER"],
  },
  {
    to: "/households",
    label: "Houses / Flats",
    icon: Building2,
    mobile: true,
    roles: ["SUPER_ADMIN", "COLLECTOR", "VIEWER"],
  },
  {
    to: "/collections",
    label: "Collections",
    icon: IndianRupee,
    mobile: true,
    roles: ["SUPER_ADMIN", "COLLECTOR", "VIEWER"],
  },
  {
    to: "/pautis",
    label: "Pautis",
    icon: Receipt,
    mobile: false,
    roles: ["SUPER_ADMIN", "COLLECTOR", "VIEWER"],
  },
  {
    to: "/expenses",
    label: "Expenses",
    icon: Wallet,
    mobile: true,
    roles: ["SUPER_ADMIN", "COLLECTOR"],
  },
  {
    to: "/hishob",
    label: "Hishob / Reports",
    icon: FileText,
    mobile: true,
    roles: ["SUPER_ADMIN", "COLLECTOR", "VIEWER"],
  },
  {
    to: "/collectors",
    label: "Collectors",
    icon: Users,
    mobile: false,
    roles: ["SUPER_ADMIN"],
  },
  {
    to: "/notifications",
    label: "Notifications",
    icon: Bell,
    mobile: false,
    roles: ["SUPER_ADMIN"],
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    mobile: false,
    roles: ["SUPER_ADMIN"],
  },
];

function Brand({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl">
        <img
          src="/ganesh-logo.jpeg"
          alt="Digital Vargani"
          className="h-full w-full object-contain"
        />
      </div>

      {compact ? null : (
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-wide">
            DIGITAL VARGANI
          </p>

          <p className="deva text-[11px] opacity-70">
            डिजिटल वर्गणी
          </p>
        </div>
      )}
    </div>
  );
}

function NavLinks({
  onNavigate,
  role,
}: {
  onNavigate?: () => void;
  role?: UserRole;
}) {
  const visibleNav = NAV.filter(
    (item) =>
      !role ||
      item.roles.includes(role),
  );

  return (
    <nav className="flex flex-col gap-1">
      {visibleNav.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeOptions={{
            exact: item.to === "/",
          }}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground"
        >
          <item.icon className="h-4.5 w-4.5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const data = useAppData();
  const [q, setQ] = useState("");

  const summaries = useMemo(
    () => householdSummaries(data),
    [data],
  );

  const term = q.trim().toLowerCase();

  const households = term
    ? summaries
        .filter(
          (s) =>
            s.household.flatNo
              .toLowerCase()
              .includes(term) ||
            s.household.residentName
              .toLowerCase()
              .includes(term) ||
            s.household.mobile.includes(term) ||
            s.collectorName
              .toLowerCase()
              .includes(term),
        )
        .slice(0, 8)
    : [];

  const collections = term
    ? data.collections
        .filter((c) =>
          c.pautiNo
            .toLowerCase()
            .includes(term),
        )
        .slice(0, 5)
    : [];

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="top-24 max-w-lg translate-y-0">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={q}
          onChange={(e) =>
            setQ(e.target.value)
          }
          placeholder="Flat no., resident, mobile, Pauti no. or collector"
        />

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {!term ? (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
              Start typing to search households and Pautis.
            </p>
          ) : null}

          {households.map((s) => (
            <Link
              key={s.household.id}
              to="/households/$id"
              params={{
                id: s.household.id,
              }}
              onClick={() =>
                onOpenChange(false)
              }
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted"
            >
              <span>
                <span className="font-semibold">
                  {s.household.flatNo}
                </span>

                <span className="ml-2 text-sm text-muted-foreground">
                  {s.household.residentName}
                </span>
              </span>

              <span className="num text-sm text-muted-foreground">
                {formatINR(s.remaining)} due
              </span>
            </Link>
          ))}

          {collections.map((c) => (
            <Link
              key={c.id}
              to="/pautis"
              search={{
                q: c.pautiNo,
              }}
              onClick={() =>
                onOpenChange(false)
              }
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted"
            >
              <span className="font-medium">
                {c.pautiNo}
              </span>

              <span className="num text-sm text-muted-foreground">
                {formatINR(c.amount)}
              </span>
            </Link>
          ))}

          {term &&
          households.length === 0 &&
          collections.length === 0 ? (
            <p className="px-1 py-6 text-center text-sm text-muted-foreground">
              No matches found.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({
  children,
}: {
  children: ReactNode;
}) {
  const data = useAppData();
  const localUser = currentUser(data);

  const {
    session,
    profile,
    signOut,
  } = useAuth();

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });

  /**
   * Prefer the authenticated Supabase profile role.
   * Fall back to the local collector role if profile
   * is not loaded yet.
   */
  const role: UserRole | undefined =
    profile?.role ?? localUser?.role;

  const unread = data.notifications.filter(
    (n) => !n.read,
  ).length;

  /**
   * Hydrate app data once when the shell mounts.
   */
  useEffect(() => {
    hydrateFromStorage();
  }, []);

  /**
   * Close the mobile drawer whenever
   * the route changes.
   */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /**
   * Lock body scrolling while the mobile
   * drawer is open.
   */
  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /**
   * Keyboard shortcuts:
   *
   * Ctrl/Cmd + K -> Search
   * Escape -> close search/drawer
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  /**
   * Mobile bottom navigation.
   * Only show items allowed for the current role.
   */
  const mobileNav = useMemo(
    () =>
      NAV.filter(
        (item) =>
          item.mobile &&
          (!role ||
            item.roles.includes(role)),
      ).slice(0, 5),
    [role],
  );

  /**
   * Notification access is admin-only.
   */
  const canViewNotifications =
    role === "SUPER_ADMIN";

  /**
   * Prevent collectors from opening the
   * Notifications page directly by URL.
   */
  useEffect(() => {
    if (
      role &&
      !canViewNotifications &&
      pathname === "/notifications"
    ) {
      void navigate({
        to: "/",
        replace: true,
      });
    }
  }, [
    role,
    canViewNotifications,
    pathname,
    navigate,
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* =========================
          DESKTOP SIDEBAR
      ========================== */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar px-4 py-5 lg:flex">
        <div className="px-1 text-sidebar-foreground">
          <Brand />
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">
          <NavLinks role={role} />
        </div>

        <div className="rounded-xl bg-sidebar-accent p-3 text-sidebar-accent-foreground">
          <p className="text-[11px] tracking-widest uppercase opacity-70">
            Signed in as
          </p>

          <p className="mt-2 truncate text-sm font-semibold">
            {profile?.name ||
              session?.user?.email ||
              "Admin"}
          </p>

          <p className="mt-0.5 text-xs opacity-70">
            {role?.replaceAll(
              "_",
              " ",
            ) || "USER"}
          </p>

          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => {
              void signOut();
            }}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* =========================
          MOBILE DRAWER
      ========================== */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-secondary/60"
            onClick={() =>
              setMenuOpen(false)
            }
          />

          <div className="absolute inset-y-0 left-0 w-[86vw] max-w-[320px] overflow-y-auto bg-sidebar px-4 py-5 text-sidebar-foreground">
            <div className="flex items-center justify-between">
              <Brand />

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setMenuOpen(false)
                }
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mt-6">
              <NavLinks
                role={role}
                onNavigate={() =>
                  setMenuOpen(false)
                }
              />
            </div>

            <div className="mt-8 rounded-xl bg-sidebar-accent p-3">
              <p className="text-[11px] tracking-widest uppercase opacity-70">
                Signed in as
              </p>

              <p className="mt-2 truncate text-sm font-semibold">
                {profile?.name ||
                  session?.user?.email ||
                  "Admin"}
              </p>

              <p className="mt-0.5 text-xs opacity-70">
                {role?.replaceAll(
                  "_",
                  " ",
                ) || "USER"}
              </p>

              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => {
                  void signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* =========================
          MAIN CONTENT
      ========================== */}
      <div className="lg:pl-64">
        {/* =========================
            HEADER
        ========================== */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() =>
              setMenuOpen(true)
            }
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold sm:text-base">
              {data.mandal.name}
            </p>

            <p className="truncate text-xs text-muted-foreground">
              Ganeshotsav {data.mandal.year}
              {" · "}
              {profile?.name ||
                localUser?.name ||
                ""}
              {" "}
              {role
                ? `(${role.replace(
                    "_",
                    " ",
                  )})`
                : ""}
            </p>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setSearchOpen(true)
            }
            aria-label="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </Button>

          {canViewNotifications ? (
            <Link
              to="/notifications"
              className="relative"
            >
              <Button
                variant="outline"
                size="icon"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
              </Button>

              {unread > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unread}
                </span>
              ) : null}
            </Link>
          ) : null}
        </header>

        <main className="px-4 pt-5 pb-28 sm:px-6 lg:pb-10">
          <RoleGuard>
            {children}
          </RoleGuard>
        </main>
      </div>

      {/* =========================
          MOBILE BOTTOM NAV
      ========================== */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-card lg:hidden"
        style={{
          paddingBottom:
            "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.max(
              mobileNav.length,
              1,
            )}, minmax(0, 1fr))`,
          }}
        >
          {mobileNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{
                exact: item.to === "/",
              }}
              className={cn(
                "flex min-h-[60px] flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors",
                "data-[status=active]:text-primary",
              )}
            >
              <item.icon className="h-5 w-5" />

              <span>
                {item.to ===
                "/households"
                  ? "Houses"
                  : item.to ===
                      "/collections"
                    ? "Collect"
                    : item.to ===
                        "/expenses"
                      ? "Expenses"
                      : item.to ===
                          "/hishob"
                        ? "Hishob"
                        : item.label.split(
                            " ",
                          )[0]}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* =========================
          GLOBAL SEARCH
      ========================== */}
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  );
}