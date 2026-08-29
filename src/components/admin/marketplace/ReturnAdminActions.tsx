"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { approveReturn, rejectReturn } from "@/app/actions/admin/marketplace";

export function ReturnAdminActions({ returnId }: { returnId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-white disabled:opacity-60"
        onClick={() =>
          start(async () => {
            const r = await approveReturn(returnId);
            if (!r.ok) alert(r.error);
            else router.refresh();
          })
        }
      >
        Onayla
      </button>
      <button
        type="button"
        disabled={pending}
        className="h-9 rounded-lg border border-border px-3 text-xs font-semibold disabled:opacity-60"
        onClick={() =>
          start(async () => {
            const note = prompt("Red gerekçesi:") ?? "";
            if (!note.trim()) return alert("Gerekçe gerekli.");
            const r = await rejectReturn(returnId, note);
            if (!r.ok) alert(r.error);
            else router.refresh();
          })
        }
      >
        Reddet
      </button>
    </div>
  );
}
