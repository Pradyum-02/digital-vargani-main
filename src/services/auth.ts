import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type UserRole =
  | "SUPER_ADMIN"
  | "TREASURER"
  | "COLLECTOR"
  | "VIEWER";

export type AuthProfile = {
  id: string;
  name: string | null;
  mobile: string | null;
  role: UserRole;
  active: boolean;
};

export type AuthState = {
  loading: boolean;
  session: Awaited<
    ReturnType<typeof supabase.auth.getSession>
  >["data"]["session"];
  profile: AuthProfile | null;
};

async function loadProfile(
  userId: string,
): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, name, mobile, role, active",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load profile:",
      error,
    );

    return null;
  }

  return data as AuthProfile | null;
}

export function useAuth() {
  const [state, setState] =
    useState<AuthState>({
      loading: true,
      session: null,
      profile: null,
    });

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
          error,
        } =
          await supabase.auth.getSession();

        if (error) {
          console.error(
            "Failed to get session:",
            error,
          );
        }

        if (!mounted) return;

        if (!session?.user) {
          setState({
            loading: false,
            session: null,
            profile: null,
          });

          return;
        }

        const profile =
          await loadProfile(
            session.user.id,
          );

        if (!mounted) return;

        setState({
          loading: false,
          session,
          profile,
        });
      } catch (error) {
        console.error(
          "Auth initialization failed:",
          error,
        );

        if (!mounted) return;

        setState({
          loading: false,
          session: null,
          profile: null,
        });
      }
    };

    initialize();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;

          /*
           * Sign-out can be handled immediately.
           */
          if (
            event === "SIGNED_OUT" ||
            !session?.user
          ) {
            setState({
              loading: false,
              session: null,
              profile: null,
            });

            return;
          }

          /*
           * Don't perform the profile query directly
           * inside the auth callback.
           */
          setState((current) => ({
            ...current,
            loading: true,
            session,
          }));

          setTimeout(async () => {
            if (!mounted) return;

            const profile =
              await loadProfile(
                session.user.id,
              );

            if (!mounted) return;

            setState({
              loading: false,
              session,
              profile,
            });
          }, 0);
        },
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ) => {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    ...state,
    signIn,
    signOut,
  };
}