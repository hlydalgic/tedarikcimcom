"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSellerRole } from "@/lib/auth/get-user-roles";

export type HeaderUser = {
  id: string;
  email: string;
  displayName: string;
  isSeller: boolean;
};

export type HeaderUserState =
  | { status: "loading" }
  | { status: "ready"; user: HeaderUser | null };

async function loadProfile(user: User): Promise<HeaderUser> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, roles")
    .eq("id", user.id)
    .maybeSingle();

  const roles = profile?.roles?.length ? (profile.roles as string[]) : ["buyer"];
  const displayName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Hesabım";

  return {
    id: user.id,
    email: user.email ?? "",
    displayName,
    isSeller: isSellerRole(roles),
  };
}

/**
 * Session is read in the browser so storefront layouts stay cookie-free and
 * can be statically cached (ISR). Login/logout are server actions followed by
 * a redirect, so the session is re-checked whenever the pathname changes.
 */
export function useHeaderUser(): HeaderUserState {
  const pathname = usePathname();
  const [state, setState] = useState<HeaderUserState>({ status: "loading" });
  const resolvedUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function sync(force = false) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      const nextId = user?.id ?? null;
      if (!force && nextId === resolvedUserId.current) return;

      const headerUser = user ? await loadProfile(user) : null;
      if (cancelled) return;
      resolvedUserId.current = nextId;
      setState({ status: "ready", user: headerUser });
    }

    void sync();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => void sync(event === "USER_UPDATED"), 0);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname]);

  return state;
}
