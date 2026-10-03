"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AddressRow } from "@/lib/orders/types";

export function useUserAddresses(enabled: boolean): {
  isLoggedIn: boolean;
  addresses: AddressRow[];
} {
  const [state, setState] = useState<{ isLoggedIn: boolean; addresses: AddressRow[] }>({
    isLoggedIn: false,
    addresses: [],
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const supabase = createClient();

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) {
        if (!cancelled) setState({ isLoggedIn: false, addresses: [] });
        return;
      }

      const { data } = await supabase
        .from("addresses")
        .select(
          `id, user_id, title, full_name, phone, city, district, address_line,
           postal_code, is_default_shipping, is_default_billing`
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!cancelled) {
        setState({ isLoggedIn: true, addresses: (data ?? []) as AddressRow[] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
