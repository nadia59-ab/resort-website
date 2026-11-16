"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "./admin-header";
import { useAdminLanguage } from "./use-admin-language";
import { deleteMedia, setPrimaryMedia, uploadMedia } from "./actions";

export type AdminMediaEntity = {
  kind: "room" | "experience";
  id: string;
  name_en: string;
  name_ar: string | null;
  name_ru: string | null;
  name_de: string | null;
};
export type AdminMediaImage = {
  id: string;
  kind: "room" | "experience";
  entityId: string;
  src: string;
  storagePath: string | null;
  sortOrder: number;
  primary: boolean;
};

const copy = {
  ar: { title: "إدارة الصور", help: "أدر صور الغرف والتجارب المعروضة على الموقع.", room: "الغرف", experience: "التجارب", select: "اختر نوع الغرفة أو التجربة", upload: "رفع الصور", primary: "الصورة الرئيسية", setPrimary: "تعيين كرئيسية", remove: "حذف", empty: "لا توجد صور لهذا العنصر بعد.", local: "صورة محلية احتياطية للعرض فقط", confirm: "هل تريد حذف هذه الصورة؟", uploadError: "تعذر رفع الصورة. تحقق من نوع الملف وحجمه (5 ميغابايت كحد أقصى).", actionError: "تعذر تنفيذ الإجراء. حاول مرة أخرى.", busy: "جارٍ العمل…" },
  en: { title: "Media management", help: "Manage the room and experience images shown on the site.", room: "Rooms", experience: "Experiences", select: "Choose a room type or experience", upload: "Upload images", primary: "Primary image", setPrimary: "Set as primary", remove: "Delete", empty: "No images for this item yet.", local: "Local fallback image (view only)", confirm: "Delete this image?", uploadError: "Image upload failed. Check file type and size (5 MB maximum).", actionError: "Could not complete the action. Please try again.", busy: "Working…" },
  ru: { title: "Управление изображениями", help: "Управляйте изображениями номеров и впечатлений на сайте.", room: "Номера", experience: "Впечатления", select: "Выберите категорию", upload: "Загрузить изображения", primary: "Главное изображение", setPrimary: "Сделать главным", remove: "Удалить", empty: "Изображений пока нет.", local: "Локальное резервное изображение (только просмотр)", confirm: "Удалить это изображение?", uploadError: "Не удалось загрузить изображение. Проверьте тип и размер файла (до 5 МБ).", actionError: "Не удалось выполнить действие. Попробуйте ещё раз.", busy: "Выполняется…" },
  de: { title: "Medien verwalten", help: "Verwalten Sie die Bilder der Zimmer und Erlebnisse auf der Website.", room: "Zimmer", experience: "Erlebnisse", select: "Zimmer oder Erlebnis auswählen", upload: "Bilder hochladen", primary: "Titelbild", setPrimary: "Als Titelbild festlegen", remove: "Löschen", empty: "Für diesen Eintrag sind noch keine Bilder vorhanden.", local: "Lokales Ersatzbild (nur Ansicht)", confirm: "Dieses Bild löschen?", uploadError: "Bild-Upload fehlgeschlagen. Dateityp und Größe prüfen (max. 5 MB).", actionError: "Aktion fehlgeschlagen. Bitte erneut versuchen.", busy: "Wird ausgeführt…" },
};

function entityName(entity: AdminMediaEntity, language: keyof typeof copy) {
  return (language === "ar" ? entity.name_ar : language === "ru" ? entity.name_ru : language === "de" ? entity.name_de : entity.name_en) || entity.name_en;
}

export default function AdminMedia({ entities, images }: { entities: AdminMediaEntity[]; images: AdminMediaImage[] }) {
  const [language] = useAdminLanguage();
  const t = copy[language];
  const [selectedKind, setSelectedKind] = useState<"room" | "experience">("room");
  const [selectedId, setSelectedId] = useState(entities.find((item) => item.kind === "room")?.id ?? entities[0]?.id ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const options = entities.filter((entity) => entity.kind === selectedKind);
  const currentId = options.some((item) => item.id === selectedId) ? selectedId : options[0]?.id ?? "";
  const currentImages = images.filter((image) => image.kind === selectedKind && image.entityId === currentId).sort((a, b) => a.sortOrder - b.sortOrder);

  function changeKind(kind: "room" | "experience") {
    setSelectedKind(kind);
    setSelectedId(entities.find((item) => item.kind === kind)?.id ?? "");
    setError("");
  }
  function uploadFiles(files: FileList | null) {
    if (!files?.length || !currentId) return;
    const selectedFiles = Array.from(files);
    startTransition(async () => {
      for (const file of selectedFiles) {
        const data = new FormData();
        data.set("file", file);
        const result = await uploadMedia(selectedKind, currentId, data);
        if (!result.ok) { setError(t.uploadError); return; }
      }
      setError("");
      router.refresh();
    });
  }
  function runImageAction(action: "primary" | "delete", image: AdminMediaImage) {
    if (action === "delete" && !window.confirm(t.confirm)) return;
    startTransition(async () => {
      const result = action === "primary"
        ? await setPrimaryMedia(selectedKind, currentId, image.id)
        : await deleteMedia(selectedKind, currentId, image.id);
      setError(result.ok ? "" : t.actionError);
      if (result.ok) router.refresh();
    });
  }

  return <main className="admin-app" dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
    <AdminHeader active="media" />
    <section className="admin-content">
      <div className="admin-page-heading"><div><p className="admin-eyebrow">RED SEA RESORT</p><h1>{t.title}</h1><p>{t.help}</p></div></div>
      <div className="admin-media-toolbar">
        <div className="admin-media-kind" role="group" aria-label={t.select}>
          <button type="button" className={selectedKind === "room" ? "is-active" : ""} onClick={() => changeKind("room")}>{t.room}</button>
          <button type="button" className={selectedKind === "experience" ? "is-active" : ""} onClick={() => changeKind("experience")}>{t.experience}</button>
        </div>
        <label className="admin-media-select"><span>{t.select}</span><select value={currentId} onChange={(event) => setSelectedId(event.target.value)}>
          {options.map((entity) => <option value={entity.id} key={entity.id}>{entityName(entity, language)}</option>)}
        </select></label>
        <label className={`admin-primary-button admin-media-upload ${pending || !currentId ? "is-disabled" : ""}`}>
          {pending ? t.busy : t.upload}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={pending || !currentId} onChange={(event) => { uploadFiles(event.currentTarget.files); event.currentTarget.value = ""; }} />
        </label>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {!currentImages.length ? <div className="admin-empty-state">{t.empty}</div> : <div className="admin-media-grid">
        {currentImages.map((image) => <article className="admin-media-card" key={image.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.src} alt={entityName(options.find((item) => item.id === currentId)!, language)} />
          <div className="admin-media-card-actions">
            {image.primary ? <span className="admin-status admin-status-confirmed">{t.primary}</span> : image.storagePath && <button type="button" className="admin-secondary-button" disabled={pending} onClick={() => runImageAction("primary", image)}>{t.setPrimary}</button>}
            {image.storagePath ? <button type="button" className="admin-danger-button" disabled={pending} onClick={() => runImageAction("delete", image)}>{t.remove}</button> : <small>{t.local}</small>}
          </div>
        </article>)}
      </div>}
    </section>
    <footer className="admin-footer">RED SEA RESORT</footer>
  </main>;
}
