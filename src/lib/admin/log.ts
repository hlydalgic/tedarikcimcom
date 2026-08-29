import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type WriteAdminLogInput = {
  admin: SupabaseClient;
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
};

export async function writeAdminLog(input: WriteAdminLogInput) {
  const { error } = await input.admin.from("admin_logs").insert({
    admin_user_id: input.adminUserId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    old_data: input.oldData ?? null,
    new_data: input.newData ?? null,
    metadata: input.metadata ?? {},
  });

  if (error && process.env.NODE_ENV === "development") {
    console.error("[writeAdminLog]", error.message);
  }
}
