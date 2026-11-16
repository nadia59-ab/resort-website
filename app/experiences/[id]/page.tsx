import { getSupabaseClient } from "@/src/lib/supabase";
import { loadExperienceMedia } from "@/src/lib/experience-media";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import ExperienceDetailContent from "../experience-detail-content";
import { addEmptyTranslations, isMissingTranslationColumns } from "@/src/lib/catalog-translations";
import { getSupabaseServerClient } from "@/src/lib/supabase-server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const client = getSupabaseClient();
  const initialExperienceResult = await client
    .from("experiences")
    .select("id, name_en, name_ar, name_ru, name_de, description_en, description_ar, description_ru, description_de, price, currency, duration_minutes")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  let experienceData = initialExperienceResult.data;
  let error = initialExperienceResult.error;
  if (isMissingTranslationColumns(error)) {
    const fallbackResult = await client
      .from("experiences")
      .select("id, name_en, name_ar, description_en, description_ar, price, currency, duration_minutes")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle();
    experienceData = fallbackResult.data as typeof experienceData;
    error = fallbackResult.error;
  }

  if (error) throw new Error("Could not load this experience.");
  if (!experienceData) notFound();
  const experience = addEmptyTranslations([experienceData])[0];

  const { media } = await loadExperienceMedia([experience]);
  let experienceMedia = media.find((item) => item.experience_id === experience.id) ?? null;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { data: images } = await getSupabaseServerClient()
        .from("experience_images")
        .select("image_url,sort_order,is_primary")
        .eq("experience_id", experience.id)
        .order("sort_order");
      if (images?.length) {
        const photos = images.map((image) => ({ src: image.image_url, fileName: image.image_url.split("/").pop() ?? "image" }));
        const primaryIndex = Math.max(0, images.findIndex((image) => image.is_primary));
        const primary = photos[primaryIndex] ?? photos[0];
        experienceMedia = { experience_id: experience.id, folder_name: "resort-media", primary, photos: [primary, ...photos.filter((photo) => photo !== primary)] };
      }
    } catch {
      // Retain the existing local-folder fallback if the media table is not available.
    }
  }

  return <ExperienceDetailContent experience={experience} media={experienceMedia} />;
}
