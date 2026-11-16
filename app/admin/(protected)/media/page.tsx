import { requireAdmin } from "@/src/lib/admin-auth";
import { getSupabaseServerClient } from "@/src/lib/supabase-server";
import { loadExperienceMedia } from "@/src/lib/experience-media";
import AdminMedia, { type AdminMediaEntity, type AdminMediaImage } from "@/app/admin/admin-media";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  const [{ data: rooms }, { data: experiences }, { data: roomRows }, { data: experienceRows }] = await Promise.all([
    supabase.from("room_types").select("id,name_en,name_ar,name_ru,name_de").order("name_en"),
    supabase.from("experiences").select("id,name_en,name_ar,name_ru,name_de").order("name_en"),
    supabase.from("room_images").select("id,image_url,storage_path,sort_order,alt_text_en,alt_text_ar,room:rooms!inner(room_type_id)").order("sort_order").order("id"),
    supabase.from("experience_images").select("id,experience_id,image_url,storage_path,sort_order,is_primary,alt_text_en,alt_text_ar").order("sort_order").order("created_at"),
  ]);

  const entities: AdminMediaEntity[] = [
    ...(rooms ?? []).map((item) => ({
      kind: "room" as const, id: item.id, name_en: item.name_en, name_ar: item.name_ar,
      name_ru: item.name_ru, name_de: item.name_de,
    })),
    ...(experiences ?? []).map((item) => ({
      kind: "experience" as const, id: item.id, name_en: item.name_en, name_ar: item.name_ar,
      name_ru: item.name_ru, name_de: item.name_de,
    })),
  ];

  const images: AdminMediaImage[] = [];
  for (const row of roomRows ?? []) {
    const linkedRoom = Array.isArray(row.room) ? row.room[0] : row.room;
    if (!linkedRoom) continue;
    images.push({
      id: row.id, kind: "room", entityId: linkedRoom.room_type_id,
      src: row.image_url, storagePath: row.storage_path, sortOrder: row.sort_order,
      primary: row.sort_order === 0,
    });
  }
  for (const row of experienceRows ?? []) {
    images.push({
      id: row.id, kind: "experience", entityId: row.experience_id,
      src: row.image_url, storagePath: row.storage_path, sortOrder: row.sort_order,
      primary: row.is_primary,
    });
  }

  const localExperienceMedia = await loadExperienceMedia((experiences ?? []).map((experience) => ({
    id: experience.id, name_en: experience.name_en,
  })));
  for (const item of localExperienceMedia.media) {
    for (const [index, photo] of item.photos.entries()) {
      images.push({
        id: `local-${item.experience_id}-${index}`, kind: "experience", entityId: item.experience_id,
        src: photo.src, storagePath: null, sortOrder: index,
        primary: photo.fileName === item.primary?.fileName,
      });
    }
  }

  return <AdminMedia entities={entities} images={images} />;
}
