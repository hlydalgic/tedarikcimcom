"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { activateUser, suspendUser } from "@/app/actions/admin/marketplace";

export function UserAdminActions({
  userId,
  status,
}: {
  userId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return status === "active" ? (
    <button
      type="button"
      disabled={pending}
      className="h-9 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 disabled:opacity-60"
      onClick={() =>
        start(async () => {
          if (!confirm("Kullanıcıyı askıya almak istiyor musunuz?")) return;
          const r = await suspendUser(userId);
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
          const r = await activateUser(userId);
          if (!r.ok) alert(r.error);
          else router.refresh();
        })
      }
    >
      Aktif et
    </button>
  );
}
