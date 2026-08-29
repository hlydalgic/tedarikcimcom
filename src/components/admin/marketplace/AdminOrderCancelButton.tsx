"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminCancelOrder } from "@/app/actions/admin/marketplace";

export function AdminOrderCancelButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      onClick={() =>
        start(async () => {
          const reason = prompt("İptal gerekçesi (opsiyonel):") ?? "";
          if (!confirm("Siparişi iptal etmek istediğinize emin misiniz?")) return;
          const r = await adminCancelOrder(orderId, reason);
          if (!r.ok) alert(r.error);
          else router.refresh();
        })
      }
    >
      {pending ? "İptal ediliyor…" : "Manuel iptal"}
    </button>
  );
}
