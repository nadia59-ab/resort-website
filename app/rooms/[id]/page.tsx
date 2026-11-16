import { getSupabaseClient } from "@/src/lib/supabase";
import { getSupabaseServerClient } from "@/src/lib/supabase-server";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import RoomDetailContent from "../room-detail-content";
import { addEmptyTranslations, isMissingTranslationColumns } from "@/src/lib/catalog-translations";

type RoomRecord = {
  id: string;
  floor_number: number | null;
  view_en: string | null;
  view_ar: string | null;
};

type RoomPhoto = {
  id: string;
  image_url: string;
  alt_text_en: string | null;
  alt_text_ar: string | null;
  sort_order: number;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const publicClient = getSupabaseClient();
  const initialRoomTypeResult = await publicClient
    .from("room_types")
    .select(
      "id, name_en, name_ar, name_ru, name_de, description_en, description_ar, description_ru, description_de, base_price, currency, max_guests",
    )
    .eq("id", id)
    .maybeSingle();

  let roomTypeData = initialRoomTypeResult.data;
  let roomTypeError = initialRoomTypeResult.error;
  if (isMissingTranslationColumns(roomTypeError)) {
    const fallbackResult = await publicClient
      .from("room_types")
      .select("id, name_en, name_ar, description_en, description_ar, base_price, currency, max_guests")
      .eq("id", id)
      .maybeSingle();
    roomTypeData = fallbackResult.data as typeof roomTypeData;
    roomTypeError = fallbackResult.error;
  }

  if (roomTypeError) throw new Error("Could not load this room type.");
  if (!roomTypeData) notFound();
  const roomType = addEmptyTranslations([roomTypeData])[0];

  let rooms: RoomRecord[] = [];
  let photos: RoomPhoto[] = [];

  // Room and gallery rows are intentionally loaded only on the server. The
  // service key never crosses the Server Component boundary into the browser.
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const serverClient = getSupabaseServerClient();
      const { data: roomRows, error: roomsError } = await serverClient
        .from("rooms")
        .select("id, floor_number, view_en, view_ar")
        .eq("room_type_id", id)
        .eq("is_active", true);

      if (roomsError) throw roomsError;
      rooms = roomRows ?? [];

      if (rooms.length > 0) {
        const { data: photoRows, error: photosError } = await serverClient
          .from("room_images")
          .select("id, image_url, alt_text_en, alt_text_ar, sort_order")
          .in("room_id", rooms.map((room) => room.id))
          .order("sort_order")
          .order("id");

        if (photosError) throw photosError;
        photos = photoRows ?? [];
      }
    } catch {
      // The room details still render with local image paths if server data is not configured.
    }
  }

  return <RoomDetailContent roomType={roomType} rooms={rooms} photos={photos} />;
}
