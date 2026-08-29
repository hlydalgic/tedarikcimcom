"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  activateSellerShop,
  setShopModerationMode,
  suspendSellerShop,
} from "@/app/actions/admin/marketplace";

export function SellerAdminActions({
  shopId,
  status,
  moderationMode,
}: {
  shopId: string;
  status: string;
  moderationMode: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {status === "active" ? (
        <button
          type="button"
          disabled={pending}
          className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          onClick={() =>
            start(async () => {
              const r = await suspendSellerShop(shopId);
              if (!r.ok) alert(r.error);
              else router.refresh();
            })
          }
        >
          Askıya al
        </button>
      ) : (
        <button
          type="button"
          disabled={pending}
          className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-white disabled:opacity-60"
          onClick={() =>
            start(async () => {
              const r = await activateSellerShop(shopId);
              if (!r.ok) alert(r.error);
              else router.refresh();
            })
          }
        >
          Aktif et
        </button>
      )}
      <select
        disabled={pending}
        defaultValue={moderationMode}
        className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
        onChange={(e) =>
          start(async () => {
            const mode = e.target.value as "MANUAL" | "AUTO";
            const r = await setShopModerationMode(shopId, mode);
            if (!r.ok) alert(r.error);
            else router.refresh();
          })
        }
      >
        <option value="MANUAL">Manuel moderasyon</option>
        <option value="AUTO">Otomatik moderasyon</option>
      </select>
    </div>
  );
}
