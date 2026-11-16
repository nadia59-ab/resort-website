import "server-only";

import { getSupabaseServerClient } from "@/src/lib/supabase-server";

type SupabaseServerClient = ReturnType<typeof getSupabaseServerClient>;

type StayOffer = {
  id: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  currency: string;
  room_type_ids: string[];
};

export type StayPrice = {
  currency: string;
  originalPrice: number;
  discountAmount: number;
  totalPrice: number;
  offerId: string | null;
};

export async function getOffersForStay(
  supabase: SupabaseServerClient,
  checkIn: string,
  checkOut: string,
): Promise<StayOffer[]> {
  const { data: offers, error } = await supabase
    .from("offers")
    .select("id, discount_type, discount_value, currency")
    .eq("is_active", true)
    .lte("starts_at", `${checkIn}T00:00:00.000Z`)
    .gte("ends_at", `${checkOut}T00:00:00.000Z`);

  if (error) throw error;
  if (!offers?.length) return [];

  const offerIds = offers.map((offer) => offer.id);
  const { data: scopes, error: scopeError } = await supabase
    .from("offer_room_types")
    .select("offer_id, room_type_id")
    .in("offer_id", offerIds);

  if (scopeError) throw scopeError;

  const roomTypeIdsByOffer = new Map<string, string[]>();
  for (const scope of scopes ?? []) {
    const ids = roomTypeIdsByOffer.get(scope.offer_id) ?? [];
    ids.push(scope.room_type_id);
    roomTypeIdsByOffer.set(scope.offer_id, ids);
  }

  return offers.map((offer) => ({
    id: offer.id,
    discount_type: offer.discount_type as StayOffer["discount_type"],
    discount_value: Number(offer.discount_value),
    currency: offer.currency,
    room_type_ids: roomTypeIdsByOffer.get(offer.id) ?? [],
  }));
}

export function calculateStayPrice(
  roomTypeId: string,
  nightlyPrice: number,
  currency: string,
  nights: number,
  offers: StayOffer[],
): StayPrice {
  const originalCents = Math.round(nightlyPrice * 100) * nights;
  let bestDiscountCents = 0;
  let bestOfferId: string | null = null;

  for (const offer of offers) {
    const appliesToRoom = offer.room_type_ids.length === 0 || offer.room_type_ids.includes(roomTypeId);
    if (!appliesToRoom || offer.currency !== currency) continue;

    const amount = offer.discount_type === "percentage"
      ? Math.round(originalCents * offer.discount_value / 100)
      : Math.round(offer.discount_value * 100);
    const discountCents = Math.min(originalCents, amount);
    if (discountCents > bestDiscountCents) {
      bestDiscountCents = discountCents;
      bestOfferId = offer.id;
    }
  }

  return {
    currency,
    originalPrice: originalCents / 100,
    discountAmount: bestDiscountCents / 100,
    totalPrice: (originalCents - bestDiscountCents) / 100,
    offerId: bestOfferId,
  };
}
