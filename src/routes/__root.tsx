import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app/AppShell";
import { useAuth } from "@/services/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>

        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  console.error(error);

  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, {
      boundary: "tanstack_root_error_component",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route =
  createRootRouteWithContext<{ queryClient: QueryClient }>()({
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          name: "theme-color",
          content: "#d97706",
        },
        {
          name: "author",
          content: "Digital Vargani",
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
      ],

      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href:
            "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap",
        },
        {
          rel: "manifest",
          href: "/manifest.webmanifest",
        },
        {
  rel: "icon",
  href: "/ganesh-logo.jpeg?v=2",
  type: "image/jpeg",
},
      ],
    }),

    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  });

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>

      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  const { loading, session, profile } = useAuth();

  const router = useRouter();

  const pathname = router.state.location.pathname;

  /*
   * These routes can be opened without authentication.
   *
   * /login  → staff login
   * /pauti  → public resident Pauti lookup
   */
  const isPublicRoute =
    pathname === "/login" ||
    pathname === "/pauti";

  useEffect(() => {
    if (loading) return;

    const authenticated =
      !!session?.user && !!profile?.active;

    /*
     * If an authenticated user manually opens /login,
     * send them to the dashboard.
     */
    if (pathname === "/login" && authenticated) {
      router.navigate({ to: "/" });
      return;
    }

    /*
     * Every route except /login and /pauti
     * requires an authenticated active profile.
     */
    if (!isPublicRoute && !authenticated) {
      router.navigate({ to: "/login" });
    }
  }, [
    loading,
    session,
    profile,
    pathname,
    isPublicRoute,
    router,
  ]);

  if (loading) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="deva text-xl font-bold">
                ग
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              Loading Digital Vargani...
            </p>
          </div>
        </div>

        <Toaster
          position="top-center"
          richColors
        />
      </QueryClientProvider>
    );
  }

  const authenticated =
    !!session?.user && !!profile?.active;

  return (
    <QueryClientProvider client={queryClient}>
      {isPublicRoute || !authenticated ? (
        <Outlet />
      ) : (
        <AppShell>
          <Outlet />
        </AppShell>
      )}

      <Toaster
        position="top-center"
        richColors
      />
    </QueryClientProvider>
  );
}