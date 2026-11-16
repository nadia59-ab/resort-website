"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AdminRoomType } from "./admin-types";
import { updateRoomPrice } from "./actions";
import AdminHeader from "./admin-header";
import { adminLabel, type AdminLanguage } from "./admin-language";
import { useAdminLanguage } from "./use-admin-language";

function roomName(room: AdminRoomType, language: AdminLanguage) {
  if (language === "ar") return room.name_ar || room.name_en;
  if (language === "ru") return room.name_ru || room.name_en;
  if (language === "de") return room.name_de || room.name_en;
  return room.name_en;
}

export default function AdminPricing({ roomTypes }: { roomTypes: AdminRoomType[] }) {
  const [language] = useAdminLanguage();
  const [savingRoom, setSavingRoom] = useState<string | null>(null);
  const [message, setMessage] = useState<{ roomId: string; key: "priceSaved" | "priceSaveError" } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function savePrice(event: FormEvent<HTMLFormElement>, roomId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const price = Number(form.get("price"));
    setSavingRoom(roomId);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await updateRoomPrice(roomId, price);
        setMessage({ roomId, key: result.ok ? "priceSaved" : "priceSaveError" });
        if (result.ok) router.refresh();
      } catch {
        setMessage({ roomId, key: "priceSaveError" });
      } finally {
        setSavingRoom(null);
      }
    });
  }

  return (
    <main className="admin-app" dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
      <AdminHeader active="pricing" />
      <section className="admin-content">
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">{adminLabel(language, "ownerPanel")}</p>
            <h1>{adminLabel(language, "pricingTitle")}</h1>
            <p>{adminLabel(language, "pricingHelp")}</p>
          </div>
          <span className="admin-booking-count">{new Intl.NumberFormat({ ar: "ar-EG", en: "en-US", ru: "ru-RU", de: "de-DE" }[language]).format(roomTypes.length)}</span>
        </div>
        <div className="admin-pricing-list">
          {roomTypes.map((room) => (
            <form className="admin-pricing-row" key={room.id} onSubmit={(event) => savePrice(event, room.id)}>
              <div>
                <h2>{roomName(room, language)}</h2>
                <p>{room.currency} · {adminLabel(language, "pricePerNight")}</p>
                {message?.roomId === room.id && <small className={message.key === "priceSaved" ? "admin-success" : "admin-error"} role="status">{adminLabel(language, message.key)}</small>}
              </div>
              <label className="admin-price-field">
                <span>{adminLabel(language, "pricePerNight")}</span>
                <input name="price" type="number" min="0" max="99999999.99" step="0.01" defaultValue={Number(room.base_price).toFixed(2)} required />
              </label>
              <button className="admin-primary-button" type="submit" disabled={isPending && savingRoom === room.id}>
                {isPending && savingRoom === room.id ? adminLabel(language, "priceSaving") : adminLabel(language, "savePrice")}
              </button>
            </form>
          ))}
        </div>
      </section>
      <footer className="admin-footer">RED SEA RESORT <span>·</span> {adminLabel(language, "ownerPanel")}</footer>
    </main>
  );
}
