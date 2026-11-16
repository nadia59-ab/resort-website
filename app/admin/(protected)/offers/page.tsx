import { requireAdmin } from "@/src/lib/admin-auth";
import { getSupabaseServerClient } from "@/src/lib/supabase-server";
import AdminOffers from "../../admin-offers";
import type { AdminOffer, AdminRoomType } from "../../admin-types";

export const dynamic = "force-dynamic";

export default async function AdminOffersPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const [offersResult, roomTypesResult] = await Promise.all([
    supabase
      .from("offers")
      .select("id, name_en, name_ar, name_ru, name_de, discount_type, discount_value, currency, starts_at, ends_at, is_active")
      .order("created_at", { ascending: false }),
    supabase
      .from("room_types")
      .select("id, name_en, name_ar, name_ru, name_de, base_price, currency")
      .order("base_price", { ascending: true }),
  ]);

  if (offersResult.error || roomTypesResult.error) throw new Error("Could not load offer settings.");

  const offerIds = (offersResult.data ?? []).map((offer) => offer.id);
  let scopes: { offer_id: string; room_type_id: string }[] = [];
  if (offerIds.length) {
    const scopesResult = await supabase
      .from("offer_room_types")
      .select("offer_id, room_type_id")
      .in("offer_id", offerIds);
    if (scopesResult.error) throw new Error("Could not load offer room types.");
    scopes = scopesResult.data ?? [];
  }

  const roomIdsByOffer = new Map<string, string[]>();
  for (const scope of scopes) {
    roomIdsByOffer.set(scope.offer_id, [...(roomIdsByOffer.get(scope.offer_id) ?? []), scope.room_type_id]);
  }

  const offers: AdminOffer[] = (offersResult.data ?? []).map((offer) => ({
    ...offer,
    discount_type: offer.discount_type as AdminOffer["discount_type"],
    discount_value: Number(offer.discount_value),
    room_type_ids: roomIdsByOffer.get(offer.id) ?? [],
  }));

  return <AdminOffers offers={offers} roomTypes={(roomTypesResult.data ?? []) as AdminRoomType[]} />;
}
