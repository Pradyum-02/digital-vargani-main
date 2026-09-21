import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/services/auth";
import type { UserRole } from "@/types";

type RoleGuardProps = {
  children: ReactNode;
};

const ADMIN_ONLY_PREFIXES = [
  "/collectors",
  "/notifications",
  "/settings",
];

const EXPENSES_PREFIX = "/expenses";

function isPathAllowed(
  pathname: string,
  role: UserRole,
) {
  // Super Admin can access everything.
  if (role === "SUPER_ADMIN") {
    return true;
  }

  // Collectors and Viewers cannot access admin-only pages.
  if (
    ADMIN_ONLY_PREFIXES.some((prefix) =>
      pathname === prefix ||
      pathname.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }

  // Viewers cannot access Expenses.
  if (
    role === "VIEWER" &&
    (
      pathname === EXPENSES_PREFIX ||
      pathname.startsWith(`${EXPENSES_PREFIX}/`)
    )
  ) {
    return false;
  }

  return true;
}

export function RoleGuard({
  children,
}: RoleGuardProps) {
  const navigate = useNavigate();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const {
    session,
    profile,
    loading,
  } = useAuth();

  /*
   * Wait until authentication/profile loading
   * has finished before making an access decision.
   */
  const role = profile?.role;

  const allowed =
    !loading &&
    !!session &&
    !!role &&
    isPathAllowed(pathname, role);

  useEffect(() => {
    if (loading) {
      return;
    }

    /*
     * If there is no authenticated session,
     * send the user to login.
     */
    if (!session) {
      void navigate({
        to: "/login",
        replace: true,
      });

      return;
    }

    /*
     * Profile is still being resolved.
     */
    if (!role) {
      return;
    }

    /*
     * User is authenticated but does not
     * have permission for this route.
     */
    if (!isPathAllowed(pathname, role)) {
      void navigate({
        to: "/",
        replace: true,
      });
    }
  }, [
    loading,
    session,
    role,
    pathname,
    navigate,
  ]);

  /*
   * While authentication/profile is loading,
   * don't render protected content.
   */
  if (loading || !session || !role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />

          <p className="mt-3 text-sm text-muted-foreground">
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  /*
   * During the redirect, avoid briefly showing
   * a page the user isn't allowed to access.
   */
  if (!allowed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">
            Access denied
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Redirecting you to the dashboard...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}