"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { deleteOffer, saveOffer, setOfferActive } from "./actions";
import AdminHeader from "./admin-header";
import type { AdminOffer, AdminRoomType } from "./admin-types";
import { adminLabel, type AdminLanguage } from "./admin-language";
import { useAdminLanguage } from "./use-admin-language";

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

type OfferDraft = Omit<OfferInput, "discount_value" | "starts_on" | "ends_on"> & {
  discount_value: string;
  starts_on: string;
  ends_on: string;
};

const blankDraft = (): OfferDraft => ({
  name_en: "",
  name_ar: "",
  name_ru: "",
  name_de: "",
  discount_type: "percentage",
  discount_value: "15",
  starts_on: "",
  ends_on: "",
  applies_to_all: true,
  room_type_ids: [],
  is_active: true,
});

function localizedName(offer: AdminOffer, language: AdminLanguage) {
  if (language === "ar") return offer.name_ar || offer.name_en;
  if (language === "ru") return offer.name_ru || offer.name_en;
  if (language === "de") return offer.name_de || offer.name_en;
  return offer.name_en;
}

function localizedRoom(room: AdminRoomType, language: AdminLanguage) {
  if (language === "ar") return room.name_ar || room.name_en;
  if (language === "ru") return room.name_ru || room.name_en;
  if (language === "de") return room.name_de || room.name_en;
  return room.name_en;
}

function dateOnly(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export default function AdminOffers({ offers, roomTypes }: { offers: AdminOffer[]; roomTypes: AdminRoomType[] }) {
  const [language] = useAdminLanguage();
  const [draft, setDraft] = useState<OfferDraft>(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [messageKey, setMessageKey] = useState<"offerCreated" | "offerUpdated" | "offerDeleted" | "offerActionError" | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const locale = { ar: "ar-EG", en: "en-US", ru: "ru-RU", de: "de-DE" }[language];
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });

  function updateDraft<K extends keyof OfferDraft>(key: K, value: OfferDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function beginEdit(offer: AdminOffer) {
    setEditingId(offer.id);
    setDraft({
      id: offer.id,
      name_en: offer.name_en,
      name_ar: offer.name_ar,
      name_ru: offer.name_ru ?? "",
      name_de: offer.name_de ?? "",
      discount_type: offer.discount_type,
      discount_value: String(offer.discount_value),
      starts_on: dateOnly(offer.starts_at),
      ends_on: dateOnly(offer.ends_at),
      applies_to_all: offer.room_type_ids.length === 0,
      room_type_ids: offer.room_type_ids,
      is_active: offer.is_active,
    });
    setMessageKey(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDraft() {
    setDraft(blankDraft());
    setEditingId(null);
    setMessageKey(null);
  }

  function submitOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessageKey(null);
    const input: OfferInput = {
      ...draft,
      ...(editingId ? { id: editingId } : {}),
      discount_value: Number(draft.discount_value),
    };

    startTransition(async () => {
      try {
        const result = await saveOffer(input);
        if (!result.ok) {
          setMessageKey("offerActionError");
          return;
        }
        setMessageKey(result.created ? "offerCreated" : "offerUpdated");
        resetDraft();
        router.refresh();
      } catch {
        setMessageKey("offerActionError");
      }
    });
  }

  function toggleActive(offer: AdminOffer) {
    setMessageKey(null);
    startTransition(async () => {
      try {
        const result = await setOfferActive(offer.id, !offer.is_active);
        setMessageKey(result.ok ? "offerUpdated" : "offerActionError");
        if (result.ok) router.refresh();
      } catch {
        setMessageKey("offerActionError");
      }
    });
  }

  function removeOffer(offer: AdminOffer) {
    if (!window.confirm(adminLabel(language, "confirmDeleteOffer"))) return;
    setMessageKey(null);
    startTransition(async () => {
      try {
        const result = await deleteOffer(offer.id);
        setMessageKey(result.ok ? "offerDeleted" : "offerActionError");
        if (result.ok) router.refresh();
      } catch {
        setMessageKey("offerActionError");
      }
    });
  }

  function toggleRoomType(id: string) {
    setDraft((current) => ({
      ...current,
      room_type_ids: current.room_type_ids.includes(id)
        ? current.room_type_ids.filter((roomId) => roomId !== id)
        : [...current.room_type_ids, id],
    }));
  }

  return (
    <main className="admin-app" dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
      <AdminHeader active="offers" />
      <section className="admin-content">
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">{adminLabel(language, "ownerPanel")}</p>
            <h1>{adminLabel(language, "offersTitle")}</h1>
            <p>{adminLabel(language, "offersHelp")}</p>
          </div>
          <span className="admin-booking-count">{new Intl.NumberFormat(locale).format(offers.length)}</span>
        </div>

        <section className="admin-form-card" aria-labelledby="admin-offer-form-title">
          <div className="admin-form-heading">
            <h2 id="admin-offer-form-title">{adminLabel(language, editingId ? "editOffer" : "newOffer")}</h2>
          </div>
          <form className="admin-offer-form" onSubmit={submitOffer}>
            <div className="admin-form-grid">
              {(["en", "ar", "ru", "de"] as const).map((localeKey) => {
                const labelKey = { en: "titleEnglish", ar: "titleArabic", ru: "titleRussian", de: "titleGerman" }[localeKey];
                const field = `name_${localeKey}` as "name_en" | "name_ar" | "name_ru" | "name_de";
                return (
                  <label key={localeKey}>
                    <span>{adminLabel(language, labelKey)}</span>
                    <input value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} required maxLength={160} dir={localeKey === "ar" ? "rtl" : "ltr"} />
                  </label>
                );
              })}
              <label>
                <span>{adminLabel(language, "discountType")}</span>
                <select value={draft.discount_type} onChange={(event) => updateDraft("discount_type", event.target.value as OfferDraft["discount_type"])}>
                  <option value="percentage">{adminLabel(language, "percentage")}</option>
                  <option value="fixed">{adminLabel(language, "fixedDiscount")}</option>
                </select>
              </label>
              <label>
                <span>{adminLabel(language, "discountValue")}{draft.discount_type === "percentage" ? " (%)" : " (USD)"}</span>
                <input type="number" min="0.01" max={draft.discount_type === "percentage" ? 100 : 99999999.99} step="0.01" value={draft.discount_value} onChange={(event) => updateDraft("discount_value", event.target.value)} required />
              </label>
              <label>
                <span>{adminLabel(language, "startsOn")}</span>
                <input type="date" value={draft.starts_on} onChange={(event) => updateDraft("starts_on", event.target.value)} required />
              </label>
              <label>
                <span>{adminLabel(language, "endsOn")}</span>
                <input type="date" min={draft.starts_on || undefined} value={draft.ends_on} onChange={(event) => updateDraft("ends_on", event.target.value)} required />
              </label>
            </div>

            <fieldset className="admin-offer-scope">
              <legend>{adminLabel(language, "appliesTo")}</legend>
              <label className="admin-radio-option">
                <input type="radio" checked={draft.applies_to_all} onChange={() => updateDraft("applies_to_all", true)} />
                <span>{adminLabel(language, "allRoomTypes")}</span>
              </label>
              <label className="admin-radio-option">
                <input type="radio" checked={!draft.applies_to_all} onChange={() => updateDraft("applies_to_all", false)} />
                <span>{adminLabel(language, "selectedRoomTypes")}</span>
              </label>
              {!draft.applies_to_all && (
                <div className="admin-room-type-options" aria-label={adminLabel(language, "selectRoomTypes")}>
                  {roomTypes.map((room) => (
                    <label className="admin-check-option" key={room.id}>
                      <input type="checkbox" checked={draft.room_type_ids.includes(room.id)} onChange={() => toggleRoomType(room.id)} />
                      <span>{localizedRoom(room, language)}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <label className="admin-active-option">
              <input type="checkbox" checked={draft.is_active} onChange={(event) => updateDraft("is_active", event.target.checked)} />
              <span>{draft.is_active ? adminLabel(language, "active") : adminLabel(language, "inactive")}</span>
            </label>

            {messageKey && <p className={messageKey === "offerActionError" ? "admin-error" : "admin-success"} role="status">{adminLabel(language, messageKey)}</p>}
            <div className="admin-form-actions">
              <button className="admin-primary-button" type="submit" disabled={isPending}>
                {isPending ? adminLabel(language, "priceSaving") : adminLabel(language, editingId ? "saveChanges" : "createOffer")}
              </button>
              {editingId && <button className="admin-secondary-button" type="button" onClick={resetDraft} disabled={isPending}>{adminLabel(language, "cancelEdit")}</button>}
            </div>
          </form>
        </section>

        <div className="admin-offer-list-heading">
          <h2>{adminLabel(language, "allOffers")}</h2>
          {offers.length === 0 && <p>{adminLabel(language, "noOffers")}</p>}
        </div>
        <div className="admin-offer-list">
          {offers.map((offer) => (
            <article className="admin-offer-card" key={offer.id}>
              <div className="admin-offer-card-main">
                <div>
                  <p className="admin-eyebrow">{offer.is_active ? adminLabel(language, "active") : adminLabel(language, "inactive")}</p>
                  <h3>{localizedName(offer, language)}</h3>
                  <p className="admin-offer-dates">{dates.format(new Date(offer.starts_at))} — {dates.format(new Date(offer.ends_at))}</p>
                  <p className="admin-offer-room-scope">
                    {offer.room_type_ids.length === 0
                      ? adminLabel(language, "allRoomTypes")
                      : offer.room_type_ids.map((id) => roomTypes.find((room) => room.id === id)).filter((room): room is AdminRoomType => Boolean(room)).map((room) => localizedRoom(room, language)).join(" · ")}
                  </p>
                </div>
                <strong className="admin-offer-value">
                  {new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(offer.discount_value)}{offer.discount_type === "percentage" ? "%" : ` ${offer.currency}`}
                </strong>
              </div>
              <div className="admin-offer-actions">
                <button className="admin-secondary-button" type="button" onClick={() => beginEdit(offer)} disabled={isPending}>{adminLabel(language, "edit")}</button>
                <button className="admin-secondary-button" type="button" onClick={() => toggleActive(offer)} disabled={isPending}>{adminLabel(language, offer.is_active ? "deactivate" : "activate")}</button>
                <button className="admin-secondary-button admin-danger-button" type="button" onClick={() => removeOffer(offer)} disabled={isPending}>{adminLabel(language, "delete")}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <footer className="admin-footer">RED SEA RESORT <span>·</span> {adminLabel(language, "ownerPanel")}</footer>
    </main>
  );
}
