"use client";

import { useState } from "react";
import Link from "next/link";
import BookingForm from "../booking-form";
import MediaFrame from "../media-frame";
import Reveal from "../reveal";
import LanguageDropdown from "../language-dropdown";
import { useLanguage } from "../use-language";
import { localizedContent, translate, translateWithValues } from "@/src/lib/i18n";

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

export default function RoomDetailContent({
  roomType,
  rooms,
  photos,
}: {
  roomType: RoomType;
  rooms: RoomRecord[];
  photos: RoomPhoto[];
}) {
  const [language, setLanguage] = useLanguage();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestsCount, setGuestsCount] = useState(String(Math.min(2, roomType.max_guests)));
  const [selectedRoomType, setSelectedRoomType] = useState(roomType.id);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const isArabic = language === "ar";
  const roomName = localizedContent(language, {
    en: roomType.name_en,
    ar: roomType.name_ar,
    ru: roomType.name_ru,
    de: roomType.name_de,
  });
  const primaryPhoto = photos.find((photo) => photo.sort_order === 0) ?? photos[0];
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId) ?? primaryPhoto;
  const fallbackImage = `/media/rooms/${roomType.name_en.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-room.jpg`;
  const mainImage = selectedPhoto?.image_url ?? fallbackImage;
  const views = Array.from(
    new Set(
      rooms
        .map((room) => (isArabic ? room.view_ar : room.view_en))
        .filter((view): view is string => Boolean(view)),
    ),
  );
  const floors = Array.from(
    new Set(rooms.map((room) => room.floor_number).filter((floor): floor is number => floor !== null)),
  ).sort((a, b) => a - b);

  function formatFloor(floor: number) {
    if (isArabic) return floor === 0 ? "الطابق الأرضي" : `الطابق ${floor}`;
    return floor === 0 ? translate(language, "Ground floor") : translateWithValues(language, "Floor {number}", "", { number: floor });
  }

  return (
    <main className="room-detail-page" lang={language} dir={isArabic ? "rtl" : "ltr"}>
      <section className="room-detail-hero">
        <MediaFrame
          src={primaryPhoto?.image_url ?? fallbackImage}
          alt={isArabic ? primaryPhoto?.alt_text_ar || roomName : primaryPhoto?.alt_text_en || roomName}
          fallbackLabel={translate(language, "A Red Sea stay", "إقامة على البحر الأحمر")}
          className="room-detail-hero-image"
        />
        <div className="room-detail-hero-shade" aria-hidden="true" />
        <header className="room-detail-header">
          <Link className="wordmark" href="/#home">
            <span className="wordmark-mark" aria-hidden="true">✳</span>
            <span className="wordmark-name">RED SEA <i>RESORT</i></span>
          </Link>
          <div className="room-detail-header-actions">
          <Link href="/#stays">{translate(language, "All rooms", "كل الغرف")}</Link>
            <LanguageDropdown language={language} onChange={setLanguage} />
          </div>
        </header>

        <div className="room-detail-title">
          <p className="eyebrow">{translate(language, "YOUR RED SEA STAY", "إقامتك على البحر الأحمر")}</p>
          <h1>{roomName}</h1>
          <a className="text-link room-detail-hero-link" href="#room-booking">
            {translate(language, "Check availability", "تحقق من التوافر")}
            <span aria-hidden="true">{isArabic ? "↓" : "↓"}</span>
          </a>
        </div>
        <Link className="room-back-link" href="/#stays">{isArabic ? "← العودة إلى الغرف" : `← ${translate(language, "Back to all rooms")}`}</Link>
      </section>

      <section className="room-detail-overview" id="room-details">
        <Reveal className="room-detail-overview-copy">
          <p className="eyebrow">{translate(language, "MADE FOR SLOWER DAYS", "مساحة للاسترخاء")}</p>
          <h2>{roomName}</h2>
          <p className="room-detail-description">
            {localizedContent(language, {
              en: roomType.description_en,
              ar: roomType.description_ar,
              ru: roomType.description_ru,
              de: roomType.description_de,
            })}
          </p>
        </Reveal>
        <Reveal className="room-detail-facts">
          <div className="room-detail-fact">
            <span className="eyebrow">{translate(language, "NIGHTLY RATE", "السعر")}</span>
            <p><span className="numeric-value">{roomType.base_price}</span> <small>{roomType.currency}</small></p>
          </div>
          <div className="room-detail-fact">
            <span className="eyebrow">{translate(language, "GUEST CAPACITY", "الضيوف")}</span>
            <p><span className="numeric-value">{roomType.max_guests}</span> <small>{translate(language, "GUESTS MAX", "ضيوف كحد أقصى")}</small></p>
          </div>
          {views.length > 0 && (
            <div className="room-detail-fact room-detail-extra">
              <span className="eyebrow">{translate(language, "ROOM VIEWS", "الإطلالة")}</span>
              <p>{views.join(" · ")}</p>
            </div>
          )}
          {floors.length > 0 && (
            <div className="room-detail-fact room-detail-extra">
              <span className="eyebrow">{translate(language, "FLOORS", "الطابق")}</span>
              <p>{floors.map(formatFloor).join(" · ")}</p>
            </div>
          )}
        </Reveal>
      </section>

      {photos.length > 1 && (
        <section className="room-gallery-section" aria-labelledby="room-gallery-heading">
          <Reveal className="room-gallery-heading">
            <p className="eyebrow">{translate(language, "A CLOSER LOOK", "تفاصيل الإقامة")}</p>
            <h2 id="room-gallery-heading">{translate(language, "A room to settle into.", "مساحة صُممت لتشعرك بالراحة.")}</h2>
          </Reveal>
          <MediaFrame
            src={mainImage}
            alt={isArabic ? selectedPhoto?.alt_text_ar || roomName : selectedPhoto?.alt_text_en || roomName}
            fallbackLabel={translate(language, "Room gallery", "صور الغرفة")}
            className="room-gallery-featured"
          />
          <div className="room-gallery-grid">
            {photos.map((photo, index) => (
              <button
                className={`room-gallery-thumb ${selectedPhoto?.id === photo.id ? "is-selected" : ""}`}
                key={photo.id}
                type="button"
                onClick={() => setSelectedPhotoId(photo.id)}
                aria-pressed={selectedPhoto?.id === photo.id}
                aria-label={translateWithValues(language, "View photo {number}", `عرض الصورة ${index + 1}`, { number: index + 1 })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.image_url}
                  alt={isArabic ? photo.alt_text_ar || roomName : photo.alt_text_en || roomName}
                  onError={(event) => {
                    event.currentTarget.style.visibility = "hidden";
                  }}
                />
                <span className="numeric-value">{String(index + 1).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="room-detail-booking" id="room-booking" aria-labelledby="room-booking-title">
        <div className="booking-intro">
          <Reveal>
            <p className="eyebrow">{translate(language, "WHEN YOU’RE READY", "خطوتك التالية")}</p>
            <h2 id="room-booking-title">{translate(language, "Begin your stay.", "ابدأ إقامتك.")}</h2>
            <p>{translate(language, "Choose your dates and guests. We’ll check this room type for availability.", "اختر التواريخ وعدد الضيوف، وسنتحقق من توافر هذه الغرفة.")}</p>
          </Reveal>
        </div>
        <div className="room-booking-fields">
          <label>
            <span>{translate(language, "Check in", "الوصول")}</span>
            <input type="date" required value={checkIn} onChange={(event) => setCheckIn(event.target.value)} />
          </label>
          <label>
            <span>{translate(language, "Check out", "المغادرة")}</span>
            <input type="date" required value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
          </label>
          <label>
            <span>{translate(language, "Guests", "الضيوف")}</span>
            <input type="number" min="1" max={roomType.max_guests} required value={guestsCount} onChange={(event) => setGuestsCount(event.target.value)} />
          </label>
        </div>
        <BookingForm
          language={language}
          checkIn={checkIn}
          checkOut={checkOut}
          guestsCount={guestsCount}
          selectedRoomType={selectedRoomType}
          setSelectedRoomType={setSelectedRoomType}
        />
      </section>

      <footer className="site-footer">
        <Link className="wordmark footer-wordmark" href="/#home">
          <span className="wordmark-mark" aria-hidden="true">✳</span>
          <span className="wordmark-name">RED SEA <i>RESORT</i></span>
        </Link>
        <Link href="/#stays">{translate(language, "ALL ROOMS", "كل الغرف")}</Link>
        <a href="#room-details">{translate(language, "BACK TO TOP ↑", "العودة إلى الأعلى ↑")}</a>
      </footer>
    </main>
  );
}
