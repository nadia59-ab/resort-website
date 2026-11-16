"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import BookingForm from "./booking-form";
import MediaFrame from "./media-frame";
import Reveal from "./reveal";
import LanguageDropdown from "./language-dropdown";
import { useLanguage } from "./use-language";
import { localizedContent, translate, translateWithValues } from "@/src/lib/i18n";

type LocalizedText = {
  name_en: string;
  name_ar: string;
  name_ru: string | null;
  name_de: string | null;
  description_en: string;
  description_ar: string;
  description_ru: string | null;
  description_de: string | null;
};

type RoomType = LocalizedText & {
  id: string;
  base_price: number;
  currency: string;
  max_guests: number;
};

type Experience = LocalizedText & {
  id: string;
  price: number;
  currency: string;
  duration_minutes: number | null;
};

type Offer = LocalizedText & {
  id: string;
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

type HomeContentProps = {
  roomTypes: RoomType[];
  experiences: Experience[];
  offers: Offer[];
  roomImages: RoomImage[];
  experienceMedia: ExperienceMedia[];
};

function mediaSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(value: string, language: "en" | "ar" | "ru" | "de") {
  const locales = { en: "en-US", ar: "ar-EG", ru: "ru-RU", de: "de-DE" };
  return new Date(value).toLocaleDateString(locales[language], {
    timeZone: "UTC",
  });
}

export default function HomeContent({
  roomTypes,
  experiences,
  offers,
  roomImages,
  experienceMedia,
}: HomeContentProps) {
  const [language, setLanguage] = useLanguage();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestsCount, setGuestsCount] = useState("2");
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const isArabic = language === "ar";

  useEffect(() => {
    const hero = document.getElementById("home");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeaderScrolled(!entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  function goToBooking(roomTypeId?: string) {
    if (roomTypeId) setSelectedRoomType(roomTypeId);
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="resort-site" lang={language} dir={isArabic ? "rtl" : "ltr"}>
      <header className={`site-header${headerScrolled ? " is-scrolled" : ""}`}>
        <a className="wordmark" href="#home" aria-label={translate(language, "Back to top", "العودة إلى البداية")}>
          <span className="wordmark-mark" aria-hidden="true">✳</span>
          <span className="wordmark-name">RED SEA <i>RESORT</i></span>
        </a>
        <nav className="desktop-nav" aria-label={translate(language, "Main navigation", "التنقل الرئيسي")}>
          <a href="#stays">{translate(language, "Stay", "الإقامة")}</a>
          <a href="#experiences">{translate(language, "Experiences", "التجارب")}</a>
          <a href="#offers">{translate(language, "Offers", "العروض")}</a>
        </nav>
        <nav className="mobile-nav" aria-label={translate(language, "Main navigation", "التنقل الرئيسي")}>
          <a href="#stays">{translate(language, "Stay", "الإقامة")}</a>
          <a href="#experiences">{translate(language, "Experiences", "التجارب")}</a>
          <a href="#offers">{translate(language, "Offers", "العروض")}</a>
          <a href="#booking">{translate(language, "Booking", "الحجز")}</a>
        </nav>
        <div className="header-actions">
          <LanguageDropdown language={language} onChange={setLanguage} />
          <a className="header-book-link" href="#booking">
            {translate(language, "Book your stay", "احجز إقامتك")}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>

      <section className="hero" id="home" aria-label={translate(language, "Red Sea resort", "المنتجع على البحر الأحمر")}>
        <div className="hero-backdrop" aria-hidden="true" />
        <video className="hero-video" autoPlay muted loop playsInline poster="/media/hero-poster.jpg" aria-hidden="true">
          <source src="/media/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="hero-shade" aria-hidden="true" />

        <motion.div
          className="hero-copy"
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: "easeOut" }}
        >
          <p className="eyebrow hero-eyebrow">
            <span /> {translate(language, "THE RED SEA · EGYPT", "البحر الأحمر · مصر")}
          </p>
          <h1>
            {language === "ar" ? (
              <>على إيقاع<br />البحر الأحمر.</>
            ) : language === "ru" ? (
              <>Тихий берег.<br /><em>Мир вдали от суеты.</em></>
            ) : language === "de" ? (
              <>Ein ruhigeres Ufer.<br /><em>Eine Welt für sich.</em></>
            ) : (
              <>A quieter shore.<br /><em>A world apart.</em></>
            )}
          </h1>
          <p className="hero-description">
            {translate(language, "Find your own rhythm between desert horizons and the open sea.", "اكتشف إقامة هادئة وتجارب لا تُنسى على ساحل البحر الأحمر.")}
          </p>
        </motion.div>

        <a className="hero-scroll" href="#stays">
          <span>{translate(language, "Discover the resort", "اكتشف المنتجع")}</span>
          <i aria-hidden="true" />
        </a>

        <form
          className="hero-booking-bar"
          onSubmit={(event) => {
            event.preventDefault();
            goToBooking();
          }}
        >
          <label className="hero-date-field">
            <span>{translate(language, "Check in", "الوصول")}</span>
            <input
              type="date"
              required
              value={checkIn}
              onChange={(event) => setCheckIn(event.target.value)}
              aria-label={translate(language, "Check-in date", "تاريخ الوصول")}
            />
          </label>
          <label className="hero-date-field">
            <span>{translate(language, "Check out", "المغادرة")}</span>
            <input
              type="date"
              required
              value={checkOut}
              onChange={(event) => setCheckOut(event.target.value)}
              aria-label={translate(language, "Check-out date", "تاريخ المغادرة")}
            />
          </label>
          <label className="hero-guests-field">
            <span>{translate(language, "Guests", "الضيوف")}</span>
            <input
              type="number"
              min="1"
              max="1000"
              required
              value={guestsCount}
              onChange={(event) => setGuestsCount(event.target.value)}
              aria-label={translate(language, "Number of guests", "عدد الضيوف")}
            />
          </label>
          <button type="submit" className="hero-search-button">
            <span>{translate(language, "Check availability", "تحقق من التوافر")}</span>
            <span aria-hidden="true">{isArabic ? "←" : "→"}</span>
          </button>
        </form>
      </section>

      <section className="intro-section" aria-labelledby="intro-title">
        <Reveal className="intro-inner" animate>
          <p className="eyebrow">{translate(language, "ROOM TO BREATHE", "مساحة للتنفس")}</p>
          <h2 id="intro-title">
            {translate(language, "Where the stillness of the desert meets the blue of the sea.", "حيث يلتقي صفاء الصحراء بزرقة البحر.")}
          </h2>
          <span className="intro-rule" aria-hidden="true" />
        </Reveal>
      </section>

      <section className="stays-section" id="stays" aria-labelledby="stays-title">
        <div className="section-heading stays-heading">
          <Reveal animate>
            <p className="eyebrow">{translate(language, "YOUR STAY", "إقامتك")}</p>
            <h2 id="stays-title">{translate(language, "A place of your own.", "مساحة لك.")}</h2>
          </Reveal>
        </div>

        <div className="home-card-grid room-card-grid">
        {roomTypes.map((roomType, index) => {
          const storedImage = roomImages.find((image) => image.room_type_id === roomType.id);
          const localPath = `/media/rooms/${mediaSlug(roomType.name_en)}-room.jpg`;
          const roomImage = storedImage?.image_url ?? localPath;
          const roomName = localizedContent(language, {
            en: roomType.name_en,
            ar: roomType.name_ar,
            ru: roomType.name_ru,
            de: roomType.name_de,
          });
          const roomDescription = localizedContent(language, {
            en: roomType.description_en,
            ar: roomType.description_ar,
            ru: roomType.description_ru,
            de: roomType.description_de,
          });
          const roomAlt = isArabic
            ? storedImage?.alt_text_ar || roomName
            : language === "en"
              ? storedImage?.alt_text_en || roomName
              : roomName;

          return (
            <Reveal className="room-story home-room-card" key={roomType.id} delay={index * 0.12} hover animate>
              <a
                className="room-image-link"
                href={`/rooms/${roomType.id}`}
                aria-label={translateWithValues(language, "View {name}", `عرض ${roomName}`, { name: roomName })}
              >
                <MediaFrame
                  src={roomImage}
                  alt={roomAlt}
                  fallbackLabel={translate(language, "A Red Sea stay", "إقامة على البحر الأحمر")}
                  className="room-image"
                />
              </a>
              <div className="room-copy">
                <p className="eyebrow room-index"><span className="numeric-value">{String(index + 1).padStart(2, "0")}</span> / {translate(language, "THE ROOMS", "الغرف")}</p>
                <h3>{roomName}</h3>
                <p className="room-description">
                  {roomDescription}
                </p>
                <div className="room-facts">
                  <span><span className="numeric-value">{roomType.base_price}</span> {roomType.currency} <small>{translate(language, "PER NIGHT", "لليلة")}</small></span>
                  <span><span className="numeric-value">{roomType.max_guests}</span> <small>{translate(language, "GUESTS MAX", "ضيوف كحد أقصى")}</small></span>
                </div>
                <a className="text-link" href={`/rooms/${roomType.id}`}>
                  {translate(language, "Discover this room", "اكتشف الغرفة")}
                  <span aria-hidden="true">{isArabic ? "←" : "→"}</span>
                </a>
              </div>
            </Reveal>
          );
        })}
        </div>
      </section>

      <section className="experiences-section" id="experiences" aria-labelledby="experiences-title">
        <div className="section-heading experience-heading">
          <Reveal animate>
            <p className="eyebrow">{translate(language, "MOMENTS TO REMEMBER", "لحظات تبقى")}</p>
            <h2 id="experiences-title">{translate(language, "Follow your curiosity.", "اتبع فضولك.")}</h2>
          </Reveal>
        </div>
        <div className="home-card-grid experience-card-grid">
        {experiences.map((experience, index) => {
          const experienceName = localizedContent(language, {
            en: experience.name_en,
            ar: experience.name_ar,
            ru: experience.name_ru,
            de: experience.name_de,
          });
          const experienceDescription = localizedContent(language, {
            en: experience.description_en,
            ar: experience.description_ar,
            ru: experience.description_ru,
            de: experience.description_de,
          });

          return (
          <Reveal className="experience-story home-experience-card" key={experience.id} delay={index * 0.12} hover animate>
            <a
              className="experience-image-link"
              href={`/experiences/${experience.id}`}
              aria-label={translateWithValues(language, "View {name}", `عرض ${experienceName}`, { name: experienceName })}
            >
              <MediaFrame
                src={experienceMedia.find((item) => item.experience_id === experience.id)?.primary?.src ?? ""}
                alt={experienceName}
                fallbackLabel={translate(language, "A Red Sea experience", "تجربة على البحر الأحمر")}
                className="experience-image"
              />
            </a>
            <div className="experience-copy">
              <p className="eyebrow experience-index"><span className="numeric-value">{String(index + 1).padStart(2, "0")}</span> / {translate(language, "EXPERIENCES", "التجارب")}</p>
              <h3>{experienceName}</h3>
              <p className="experience-description">{experienceDescription}</p>
              <p className="experience-fact">
                <span className="numeric-value">{experience.price}</span> {experience.currency}
                {experience.duration_minutes !== null && (
                  <> <span aria-hidden="true">·</span> <span className="numeric-value">{experience.duration_minutes}</span> {translate(language, "MINUTES", "دقيقة")}</>
                )}
              </p>
              <a className="text-link" href={`/experiences/${experience.id}`}>
                {translate(language, "Discover this experience", "اكتشف التجربة")}
                <span aria-hidden="true">{isArabic ? "←" : "→"}</span>
              </a>
            </div>
          </Reveal>
          );
        })}
        </div>
      </section>

      <section className="offers-section" id="offers" aria-labelledby="offers-title">
        <Reveal className="offers-inner" animate>
          <p className="eyebrow">{translate(language, "A LITTLE MORE TO LOOK FORWARD TO", "لفترة محدودة")}</p>
          <h2 id="offers-title">{translate(language, "Seasonal privileges.", "مزايا موسمية.")}</h2>
          {offers.length > 0 ? (
            <div className="offer-list">
              {offers.map((offer) => (
                <article className="offer-item" key={offer.id}>
                  <div>
                    <h3>{localizedContent(language, {
                      en: offer.name_en,
                      ar: offer.name_ar,
                      ru: offer.name_ru,
                      de: offer.name_de,
                    })}</h3>
                    <p>{localizedContent(language, {
                      en: offer.description_en,
                      ar: offer.description_ar,
                      ru: offer.description_ru,
                      de: offer.description_de,
                    })}</p>
                    <small>{formatDate(offer.starts_at, language)} — {formatDate(offer.ends_at, language)}</small>
                  </div>
                  <p className="offer-value">
                    <span className="numeric-value">{offer.discount_value}</span>{offer.discount_type === "percentage" ? "%" : ` ${offer.currency}`}
                    <small>{translate(language, "SAVING", "خصم")}</small>
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-offers">
              {translate(language, "There are no seasonal offers at this time.", "لا توجد عروض موسمية متاحة الآن.")}
            </p>
          )}
        </Reveal>
      </section>

      <section className="booking-section" id="booking" aria-labelledby="booking-title">
        <div className="booking-intro">
          <Reveal animate>
            <p className="eyebrow">{translate(language, "WHEN YOU’RE READY", "خطوتك التالية")}</p>
            <h2 id="booking-title">{translate(language, "Begin your stay.", "ابدأ إقامتك.")}</h2>
            <p>{translate(language, "Choose a room, then leave us your details.", "اختر غرفتك وأخبرنا كيف نتواصل معك.")}</p>
          </Reveal>
        </div>
        <BookingForm
          language={language}
          checkIn={checkIn}
          checkOut={checkOut}
          guestsCount={guestsCount}
          setSelectedRoomType={setSelectedRoomType}
          selectedRoomType={selectedRoomType}
          showStayFields
          setCheckIn={setCheckIn}
          setCheckOut={setCheckOut}
          setGuestsCount={setGuestsCount}
        />
      </section>

      <footer className="site-footer">
        <a className="wordmark footer-wordmark" href="#home">
          <span className="wordmark-mark" aria-hidden="true">✳</span>
          <span className="wordmark-name">RED SEA <i>RESORT</i></span>
        </a>
        <p>{translate(language, "THE RED SEA · EGYPT", "البحر الأحمر · مصر")}</p>
        <a href="#home">{translate(language, "BACK TO TOP ↑", "العودة إلى الأعلى ↑")}</a>
      </footer>
    </main>
  );
}
