import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import {
  IndianRupee,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { useAuth } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute(
  "/login",
)({
  head: () => ({
    meta: [
      {
        title: "Login — Digital Vargani",
      },
      {
        name: "description",
        content:
          "Sign in to Digital Vargani",
      },
    ],
  }),

  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const {
    session,
    profile,
    loading,
    signIn,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (
      !loading &&
      session &&
      profile?.active
    ) {
      navigate({
        to: "/",
      });
    }

    if (
      !loading &&
      session &&
      !profile
    ) {
      setError(
        "Login succeeded, but your profile is not configured. Please contact the administrator.",
      );
    }

    if (
      !loading &&
      session &&
      profile &&
      !profile.active
    ) {
      setError(
        "Your account is inactive. Please contact the administrator.",
      );
    }
  }, [
    loading,
    session,
    profile,
    navigate,
  ]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    const normalizedEmail =
      email.trim();

    if (
      !normalizedEmail ||
      !password
    ) {
      setError(
        "Please enter your email and password.",
      );

      return;
    }

    setSubmitting(true);

    try {
      const {
        error: signInError,
      } = await signIn(
        normalizedEmail,
        password,
      );

      if (signInError) {
        console.error(
          "Sign in failed:",
          signInError,
        );

        setError(
          signInError.message ||
            "Invalid email or password.",
        );

        setSubmitting(false);

        return;
      }

      /*
       * Do not navigate manually here.
       *
       * useAuth() will receive the auth event,
       * load the profile, and redirect through
       * the effect above.
       */
    } catch (error) {
      console.error(
        "Unexpected login error:",
        error,
      );

      setError(
        "Something went wrong while signing in. Please try again.",
      );

      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <IndianRupee className="h-7 w-7" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            DIGITAL VARGANI
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            डिजिटल वर्गणी
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Welcome back
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to manage your
              Ganpati Mandal.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="email">
                Email
              </Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target
                        .value,
                    )
                  }
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password
              </Label>

              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target
                        .value,
                    )
                  }
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                submitting
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Digital Vargani · Ganeshotsav
          Management System
        </p>
      </div>
    </main>
  );
}