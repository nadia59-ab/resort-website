import { getSupabaseServerClient } from "@/src/lib/supabase-server";
import { requireAdmin } from "@/src/lib/admin-auth";
import AdminPricing from "../../admin-pricing";
import type { AdminRoomType } from "../../admin-types";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("room_types")
    .select("id, name_en, name_ar, name_ru, name_de, base_price, currency")
    .order("base_price", { ascending: true });

  if (error) throw new Error("Could not load room pricing.");
  return <AdminPricing roomTypes={(data ?? []) as AdminRoomType[]} />;
}
