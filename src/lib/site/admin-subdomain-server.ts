import "server-only";

import { headers } from "next/headers";
import { isAdminSubdomainHost } from "@/lib/site/admin-subdomain";

export function isAdminSubdomainRequestFromHeaders(): boolean {
  const headerStore = headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) return false;
  return isAdminSubdomainHost(host.split(":")[0] ?? null);
}
