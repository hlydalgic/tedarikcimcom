"use server";

import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/admin/require-admin-client";
import { writeAdminLog } from "@/lib/admin/log";

export type UnitActionState = {
  success?: boolean;
  error?: string;
  unitId?: string;
};

function revalidate() {
  revalidatePath("/admin/birimler");
  revalidatePath("/admin/ozellikler");
  revalidatePath("/admin/kategoriler");
}

export async function createUnit(input: {
  name: string;
  symbol: string;
  category: string;
}): Promise<UnitActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const name = input.name.trim();
  const symbol = input.symbol.trim();
  const category = input.category.trim() || "other";

  if (name.length < 1) return { error: "Birim adı gerekli." };
  if (symbol.length < 1) return { error: "Sembol gerekli." };

  const { data, error } = await ctx.admin
    .from("units")
    .insert({ name, symbol, category })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("units_symbol_category")) {
      return { error: "Bu sembol aynı kategoride zaten var." };
    }
    return { error: error.message };
  }

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "unit.create",
    entityType: "unit",
    entityId: data.id,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true, unitId: data.id };
}

export async function updateUnit(input: {
  id: string;
  name?: string;
  symbol?: string;
  category?: string;
}): Promise<UnitActionState> {
  const ctx = await requireAdminClient();
  if (!ctx.ok) return { error: ctx.error };

  const { data: oldRow } = await ctx.admin
    .from("units")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (!oldRow) return { error: "Birim bulunamadı." };

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.symbol !== undefined) patch.symbol = input.symbol.trim();
  if (input.category !== undefined) patch.category = input.category.trim();

  const { data, error } = await ctx.admin
    .from("units")
    .update(patch)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) return { error: error.message };

  await writeAdminLog({
    admin: ctx.admin,
    adminUserId: ctx.userId,
    action: "unit.update",
    entityType: "unit",
    entityId: input.id,
    oldData: oldRow as Record<string, unknown>,
    newData: data as Record<string, unknown>,
  });

  revalidate();
  return { success: true, unitId: input.id };
}
