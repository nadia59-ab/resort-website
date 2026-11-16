"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/src/lib/admin-auth";
import { getSupabaseServerClient } from "@/src/lib/supabase-server";
import { randomUUID } from "node:crypto";

type ActionStatus = "confirmed" | "cancelled" | "completed";
type OfferInput = {
  id?: string;
  name_en: string;
  name_ar: string;
  name_ru: string;
  name_de: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  starts_on: string;
  ends_on: string;
  applies_to_all: boolean;
  room_type_ids: string[];
  is_active: boolean;
};

function isBookingId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function todayInResortTimezone() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export async function updateBookingStatus(bookingId: string, nextStatus: ActionStatus) {
  await requireAdmin();

  if (
    typeof bookingId !== "string" ||
    typeof nextStatus !== "string" ||
    !isBookingId(bookingId) ||
    !["confirmed", "cancelled", "completed"].includes(nextStatus)
  ) {
    return { ok: false as const };
  }

  const allowedCurrentStatuses: Record<ActionStatus, string[]> = {
    confirmed: ["pending"],
    cancelled: ["pending", "confirmed"],
    completed: ["confirmed"],
  };

  const supabase = getSupabaseServerClient();
  let updateQuery = supabase
    .from("bookings")
    .update({ status: nextStatus })
    .eq("id", bookingId)
    .in("status", allowedCurrentStatuses[nextStatus]);
  const today = todayInResortTimezone();
  if (nextStatus === "completed") updateQuery = updateQuery.lte("check_out", today);
  const { data, error } = await updateQuery.select("id").maybeSingle();

  if (error || !data) {
    if (nextStatus === "completed") {
      const { data: booking } = await supabase.from("bookings").select("status,check_out").eq("id", bookingId).maybeSingle();
      if (booking?.status === "confirmed" && booking.check_out > today) {
        return { ok: false as const, reason: "checkout_in_future" as const };
      }
    }
    return { ok: false as const };
  }

  revalidatePath("/admin");
  return { ok: true as const };
}

export async function updateRoomPrice(roomTypeId: string, priceValue: number) {
  await requireAdmin();
  const cents = Math.round(priceValue * 100);
  if (!isBookingId(roomTypeId) || !Number.isFinite(priceValue) || priceValue < 0 || cents > 9_999_999_999) {
    return { ok: false as const };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("room_types")
    .update({ base_price: cents / 100 })
    .eq("id", roomTypeId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false as const };
  revalidatePath("/admin/pricing");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/rooms/[id]", "page");
  return { ok: true as const };
}

function isDateOnly(value: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validOfferInput(input: OfferInput) {
  const titleFields = [input.name_en, input.name_ar, input.name_ru, input.name_de];
  return titleFields.every((value) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= 160)
    && (input.discount_type === "percentage" || input.discount_type === "fixed")
    && Number.isFinite(input.discount_value)
    && input.discount_value > 0
    && input.discount_value <= (input.discount_type === "percentage" ? 100 : 99_999_999.99)
    && isDateOnly(input.starts_on)
    && isDateOnly(input.ends_on)
    && input.ends_on >= input.starts_on
    && typeof input.applies_to_all === "boolean"
    && typeof input.is_active === "boolean"
    && Array.isArray(input.room_type_ids)
    && input.room_type_ids.length <= 100
    && input.room_type_ids.every((id) => typeof id === "string" && isBookingId(id))
    && (input.applies_to_all || input.room_type_ids.length > 0);
}

async function validateRoomTypeIds(ids: string[]) {
  if (ids.length === 0) return true;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("room_types").select("id").in("id", [...new Set(ids)]);
  return !error && (data?.length ?? 0) === new Set(ids).size;
}

export async function saveOffer(input: OfferInput) {
  await requireAdmin();
  if (!input || typeof input !== "object" || !validOfferInput(input)) return { ok: false as const };
  if (input.id !== undefined && (typeof input.id !== "string" || !isBookingId(input.id))) {
    return { ok: false as const };
  }
  if (!await validateRoomTypeIds(input.applies_to_all ? [] : input.room_type_ids)) {
    return { ok: false as const };
  }

  const supabase = getSupabaseServerClient();
  const offerData = {
    name_en: input.name_en.trim(),
    name_ar: input.name_ar.trim(),
    name_ru: input.name_ru.trim(),
    name_de: input.name_de.trim(),
    discount_type: input.discount_type,
    discount_value: Math.round(input.discount_value * 100) / 100,
    currency: "USD",
    starts_at: `${input.starts_on}T00:00:00.000Z`,
    ends_at: `${input.ends_on}T23:59:59.999Z`,
    is_active: false,
  };

  let offerId = input.id;
  if (offerId) {
    const { data, error } = await supabase.from("offers").update(offerData).eq("id", offerId).select("id").maybeSingle();
    if (error || !data) return { ok: false as const };

    const { error: deleteScopesError } = await supabase.from("offer_room_types").delete().eq("offer_id", offerId);
    if (deleteScopesError) return { ok: false as const };
  } else {
    const { data, error } = await supabase.from("offers").insert({
      ...offerData,
      description_en: "A special offer for your Red Sea stay.",
      description_ar: null,
      description_ru: null,
      description_de: null,
    }).select("id").single();
    if (error || !data) return { ok: false as const };
    offerId = data.id;
  }

  if (!input.applies_to_all) {
    const { error } = await supabase.from("offer_room_types").insert(
      [...new Set(input.room_type_ids)].map((room_type_id) => ({ offer_id: offerId, room_type_id })),
    );
    if (error) return { ok: false as const };
  }

  const { error: activateError } = await supabase
    .from("offers")
    .update({ is_active: input.is_active })
    .eq("id", offerId);
  if (activateError) return { ok: false as const };

  revalidatePath("/admin/offers");
  revalidatePath("/");
  return { ok: true as const, created: !input.id };
}

export async function setOfferActive(offerId: string, isActive: boolean) {
  await requireAdmin();
  if (!isBookingId(offerId) || typeof isActive !== "boolean") return { ok: false as const };

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("offers").update({ is_active: isActive }).eq("id", offerId).select("id").maybeSingle();
  if (error || !data) return { ok: false as const };

  revalidatePath("/admin/offers");
  revalidatePath("/");
  return { ok: true as const };
}

export async function deleteOffer(offerId: string) {
  await requireAdmin();
  if (!isBookingId(offerId)) return { ok: false as const };

  const supabase = getSupabaseServerClient();
  const { error: deactivateError } = await supabase.from("offers").update({ is_active: false }).eq("id", offerId);
  if (deactivateError) return { ok: false as const };
  const { error } = await supabase.from("offers").delete().eq("id", offerId);
  if (error) return { ok: false as const };

  revalidatePath("/admin/offers");
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true as const };
}

type MediaKind = "room" | "experience";

function validMediaTarget(kind: MediaKind, id: string) {
  return (kind === "room" || kind === "experience") && isBookingId(id);
}

async function mediaTarget(supabase: ReturnType<typeof getSupabaseServerClient>, kind: MediaKind, id: string) {
  if (kind === "experience") {
    const { data } = await supabase.from("experiences").select("id").eq("id", id).maybeSingle();
    return data ? { experienceId: id, roomId: null as string | null, roomIds: [] as string[] } : null;
  }
  const { data: rooms } = await supabase.from("rooms").select("id").eq("room_type_id", id).order("id");
  if (!rooms?.length) return null;
  return { experienceId: null as string | null, roomId: rooms[0].id as string, roomIds: rooms.map((room) => room.id as string) };
}

export async function uploadMedia(kind: MediaKind, entityId: string, formData: FormData) {
  await requireAdmin();
  if (!validMediaTarget(kind, entityId)) return { ok: false as const };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) {
    return { ok: false as const };
  }
  const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const extension = extensions[file.type];
  if (!extension) return { ok: false as const };

  const supabase = getSupabaseServerClient();
  const target = await mediaTarget(supabase, kind, entityId);
  if (!target) return { ok: false as const };
  const path = `${kind === "room" ? "rooms" : "experiences"}/${entityId}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const validSignature = file.type === "image/jpeg"
    ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    : file.type === "image/png"
      ? buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (!validSignature) return { ok: false as const };
  const { error: uploadError } = await supabase.storage.from("resort-media").upload(path, buffer, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) return { ok: false as const };
  const imageUrl = supabase.storage.from("resort-media").getPublicUrl(path).data.publicUrl;

  if (kind === "room") {
    const { data: current } = await supabase.from("room_images").select("sort_order").in("room_id", target.roomIds).order("sort_order", { ascending: false }).limit(1);
    const { error } = await supabase.from("room_images").insert({
      room_id: target.roomId, image_url: imageUrl, storage_path: path,
      alt_text_en: "Resort room", alt_text_ar: "غرفة المنتجع", sort_order: (current?.[0]?.sort_order ?? -1) + 1,
    });
    if (error) {
      await supabase.storage.from("resort-media").remove([path]);
      return { ok: false as const };
    }
  } else {
    const { data: current } = await supabase.from("experience_images").select("sort_order").eq("experience_id", entityId).order("sort_order", { ascending: false }).limit(1);
    const isPrimary = !current?.length;
    const { error } = await supabase.from("experience_images").insert({
      experience_id: entityId, image_url: imageUrl, storage_path: path,
      alt_text_en: "Resort experience", alt_text_ar: "تجربة في المنتجع",
      sort_order: (current?.[0]?.sort_order ?? -1) + 1, is_primary: isPrimary,
    });
    if (error) {
      await supabase.storage.from("resort-media").remove([path]);
      return { ok: false as const };
    }
  }
  revalidatePath("/");
  revalidatePath("/admin/media");
  revalidatePath("/rooms/[id]", "page");
  revalidatePath("/experiences/[id]", "page");
  return { ok: true as const };
}

export async function setPrimaryMedia(kind: MediaKind, entityId: string, imageId: string) {
  await requireAdmin();
  if (!validMediaTarget(kind, entityId) || !isBookingId(imageId)) return { ok: false as const };
  const supabase = getSupabaseServerClient();
  const target = await mediaTarget(supabase, kind, entityId);
  if (!target) return { ok: false as const };
  if (kind === "experience") {
    const { data: image } = await supabase.from("experience_images").select("id").eq("id", imageId).eq("experience_id", entityId).maybeSingle();
    if (!image) return { ok: false as const };
    await supabase.from("experience_images").update({ is_primary: false }).eq("experience_id", entityId);
    const { error } = await supabase.from("experience_images").update({ is_primary: true, sort_order: 0 }).eq("id", imageId);
    if (error) return { ok: false as const };
  } else {
    const { data: image } = await supabase.from("room_images").select("id").eq("id", imageId).in("room_id", target.roomIds).maybeSingle();
    if (!image) return { ok: false as const };
    const { data: rows } = await supabase.from("room_images").select("id").in("room_id", target.roomIds).order("id");
    const ordered = [imageId, ...(rows ?? []).map((row) => row.id).filter((id) => id !== imageId)];
    for (let index = 0; index < ordered.length; index++) {
      const { error } = await supabase.from("room_images").update({ sort_order: index }).eq("id", ordered[index]);
      if (error) return { ok: false as const };
    }
  }
  revalidatePath("/");
  revalidatePath("/admin/media");
  revalidatePath("/rooms/[id]", "page");
  revalidatePath("/experiences/[id]", "page");
  return { ok: true as const };
}

export async function deleteMedia(kind: MediaKind, entityId: string, imageId: string) {
  await requireAdmin();
  if (!validMediaTarget(kind, entityId) || !isBookingId(imageId)) return { ok: false as const };
  const supabase = getSupabaseServerClient();
  const target = await mediaTarget(supabase, kind, entityId);
  if (!target) return { ok: false as const };
  const query = kind === "experience"
    ? supabase.from("experience_images").select("id,storage_path").eq("experience_id", entityId).eq("id", imageId).maybeSingle()
    : supabase.from("room_images").select("id,storage_path").in("room_id", target.roomIds).eq("id", imageId).maybeSingle();
  const { data: image } = await query;
  if (!image?.storage_path) return { ok: false as const };
  const { error: storageError } = await supabase.storage.from("resort-media").remove([image.storage_path]);
  if (storageError) return { ok: false as const };
  const { error } = kind === "experience"
    ? await supabase.from("experience_images").delete().eq("id", imageId)
    : await supabase.from("room_images").delete().eq("id", imageId);
  if (error) return { ok: false as const };
  revalidatePath("/");
  revalidatePath("/admin/media");
  revalidatePath("/rooms/[id]", "page");
  revalidatePath("/experiences/[id]", "page");
  return { ok: true as const };
}
