"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  holdSettlement,
  releaseSettlement,
} from "@/app/actions/admin/marketplace";

export function SettlementAdminActions({
  settlementId,
  status,
}: {
  settlementId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {["PENDING", "WAITING_DELIVERY", "RELEASE_REQUESTED"].includes(status) ? (
        <button
          type="button"
          disabled={pending}
          className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white disabled:opacity-60"
          onClick={() =>
            start(async () => {
              const r = await releaseSettlement(settlementId);
              if (!r.ok) alert(r.error);
              else router.refresh();
            })
          }
        >
          Erken release
        </button>
      ) : null}
      {["ELIGIBLE", "RELEASE_REQUESTED"].includes(status) ? (
        <button
          type="button"
          disabled={pending}
          className="h-8 rounded-lg border border-border px-3 text-xs font-semibold disabled:opacity-60"
          onClick={() =>
            start(async () => {
              const r = await holdSettlement(settlementId);
              if (!r.ok) alert(r.error);
              else router.refresh();
            })
          }
        >
          Beklet
        </button>
      ) : null}
    </div>
  );
}
