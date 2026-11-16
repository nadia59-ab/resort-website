import { getSupabaseClient } from "@/src/lib/supabase";
import { getSupabaseServerClient } from "@/src/lib/supabase-server";
import { loadExperienceMedia } from "@/src/lib/experience-media";
import { connection } from "next/server";
import HomeContent from "./home-content";
import { addEmptyTranslations, isMissingTranslationColumns } from "@/src/lib/catalog-translations";

type RoomType = {
  id: string;
  name_en: string;
  name_ar: string;
  name_ru: string | null;
  name_de: string | null;
  description_en: string;
  description_ar: string;
  description_ru: string | null;
  description_de: string | null;
  base_price: number;
  currency: string;
  max_guests: number;
};

type Experience = {
  id: string;
  name_en: string;
  name_ar: string;
  name_ru: string | null;
  name_de: string | null;
  description_en: string;
  description_ar: string;
  description_ru: string | null;
  description_de: string | null;
  price: number;
  currency: string;
  duration_minutes: number | null;
};

type Offer = {
  id: string;
  name_en: string;
  name_ar: string;
  name_ru: string | null;
  name_de: string | null;
  description_en: string;
  description_ar: string;
  description_ru: string | null;
  description_de: string | null;
  discount_type: string;
  discount_value: number;
  currency: string;
  starts_at: string;
  ends_at: string;
};

type RoomImage = {
  room_type_id: string;
  image_url: string;
  alt_text_en: string | null;
  alt_text_ar: string | null;
};

type ExperienceMedia = {
  experience_id: string;
  folder_name: string;
  primary: { src: string; fileName: string } | null;
  photos: { src: string; fileName: string }[];
};

export default async function Home() {
  await connection();
  const now = new Date().toISOString();
  let roomTypes: RoomType[] = [];
  let experiences: Experience[] = [];
  let offers: Offer[] = [];
  let roomImages: RoomImage[] = [];
  let experienceMedia: ExperienceMedia[] = [];
  let errorMessage: string | null = null;

  try {
    const supabase = getSupabaseClient();
    const [roomTypesResult, experiencesResult, offersResult] = await Promise.all([
      supabase
        .from("room_types")
        .select(
          "id, name_en, name_ar, name_ru, name_de, description_en, description_ar, description_ru, description_de, base_price, currency, max_guests",
        ),
      supabase
        .from("experiences")
        .select(
          "id, name_en, name_ar, name_ru, name_de, description_en, description_ar, description_ru, description_de, price, currency, duration_minutes",
        )
        .eq("is_active", true),
      supabase
        .from("offers")
        .select(
          "id, name_en, name_ar, name_ru, name_de, description_en, description_ar, description_ru, description_de, discount_type, discount_value, currency, starts_at, ends_at",
        )
        .eq("is_active", true)
        .lte("starts_at", now)
        .gte("ends_at", now),
    ]);

    let roomTypeRows: unknown[] = roomTypesResult.data ?? [];
    let experienceRows: unknown[] = experiencesResult.data ?? [];
    let offerRows: unknown[] = offersResult.data ?? [];
    let roomTypesError = roomTypesResult.error;
    let experiencesError = experiencesResult.error;
    let offersError = offersResult.error;

    if ([roomTypesError, experiencesError, offersError].some(isMissingTranslationColumns)) {
      const [legacyRoomTypesResult, legacyExperiencesResult, legacyOffersResult] = await Promise.all([
        supabase
          .from("room_types")
          .select("id, name_en, name_ar, description_en, description_ar, base_price, currency, max_guests"),
        supabase
          .from("experiences")
          .select("id, name_en, name_ar, description_en, description_ar, price, currency, duration_minutes")
          .eq("is_active", true),
        supabase
          .from("offers")
          .select("id, name_en, name_ar, description_en, description_ar, discount_type, discount_value, currency, starts_at, ends_at")
          .eq("is_active", true)
          .lte("starts_at", now)
          .gte("ends_at", now),
      ]);
      roomTypeRows = legacyRoomTypesResult.data ?? [];
      experienceRows = legacyExperiencesResult.data ?? [];
      offerRows = legacyOffersResult.data ?? [];
      roomTypesError = legacyRoomTypesResult.error;
      experiencesError = legacyExperiencesResult.error;
      offersError = legacyOffersResult.error;
    }

    if (roomTypesError) throw roomTypesError;
    if (experiencesError) throw experiencesError;
    if (offersError) throw offersError;

    roomTypes = addEmptyTranslations(roomTypeRows as RoomType[]);
    experiences = addEmptyTranslations(experienceRows as Experience[]);
    offers = addEmptyTranslations(offerRows as Offer[]);
  } catch (error) {
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
  }

  try {
    const mediaResult = await loadExperienceMedia(experiences);
    experienceMedia = mediaResult.media;
  } catch {
    experienceMedia = [];
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY && experiences.length > 0) {
    try {
      const supabase = getSupabaseServerClient();
      const { data: uploaded } = await supabase
        .from("experience_images")
        .select("experience_id,image_url,sort_order,is_primary")
        .order("sort_order");
      const uploadedByExperience = new Map<string, typeof uploaded>();
      for (const image of uploaded ?? []) {
        uploadedByExperience.set(image.experience_id, [...(uploadedByExperience.get(image.experience_id) ?? []), image]);
      }
      experienceMedia = experiences.flatMap((experience) => {
        const images = uploadedByExperience.get(experience.id);
        if (!images?.length) return experienceMedia.filter((item) => item.experience_id === experience.id);
        const photos = images.map((image) => ({ src: image.image_url, fileName: image.image_url.split("/").pop() ?? "image" }));
        const primaryIndex = Math.max(0, images.findIndex((image) => image.is_primary));
        const primary = photos[primaryIndex] ?? photos[0];
        return [{ experience_id: experience.id, folder_name: "resort-media", primary, photos: [primary, ...photos.filter((photo) => photo !== primary)] }];
      });
    } catch {
      // Continue to use the existing local-folder galleries if the media migration is not installed yet.
    }
  }

  // Room images are private under the anonymous RLS rules, so read only their
  // display fields through the server-only key when it has been configured.
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = getSupabaseServerClient();
      const { data } = await supabase
        .from("room_images")
        .select(
          "image_url, alt_text_en, alt_text_ar, sort_order, room:rooms!inner(room_type_id, is_active)",
        )
        .eq("room.is_active", true)
        .order("sort_order");

      const imagesByType = new Set<string>();
      roomImages = (data ?? []).flatMap((image) => {
        const room = Array.isArray(image.room) ? image.room[0] : image.room;
        if (!room || image.sort_order !== 0 || imagesByType.has(room.room_type_id)) return [];
        imagesByType.add(room.room_type_id);
        return room
          ? [
              {
                room_type_id: room.room_type_id,
                image_url: image.image_url,
                alt_text_en: image.alt_text_en,
                alt_text_ar: image.alt_text_ar,
              },
            ]
          : [];
      });
    } catch {
      // Local media paths are used as a fallback until the key and image rows exist.
    }
  }

  return errorMessage ? (
    <main className="load-error">
      <p>{errorMessage}</p>
    </main>
  ) : (
    <HomeContent
      roomTypes={roomTypes}
      experiences={experiences}
      offers={offers}
      roomImages={roomImages}
      experienceMedia={experienceMedia}
    />
  );
}
