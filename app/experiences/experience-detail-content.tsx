"use client";

import { useState } from "react";
import Link from "next/link";
import MediaFrame from "../media-frame";
import Reveal from "../reveal";
import LanguageDropdown from "../language-dropdown";
import { useLanguage } from "../use-language";
import { localizedContent, translate, translateWithValues } from "@/src/lib/i18n";

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

type Photo = {
  src: string;
  fileName: string;
};

type ExperienceMedia = {
  experience_id: string;
  folder_name: string;
  primary: Photo | null;
  photos: Photo[];
};

export default function ExperienceDetailContent({
  experience,
  media,
}: {
  experience: Experience;
  media: ExperienceMedia | null;
}) {
  const [language, setLanguage] = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = useState(media?.primary?.fileName ?? "");
  const isArabic = language === "ar";
  const experienceName = localizedContent(language, {
    en: experience.name_en,
    ar: experience.name_ar,
    ru: experience.name_ru,
    de: experience.name_de,
  });
  const currentPhoto = media?.photos.find((photo) => photo.fileName === selectedPhoto) ?? media?.primary ?? media?.photos[0];

  return (
    <main className="room-detail-page" lang={language} dir={isArabic ? "rtl" : "ltr"}>
      <section className="room-detail-hero">
        <MediaFrame
          src={media?.primary?.src ?? ""}
          alt={experienceName}
          fallbackLabel={translate(language, "A Red Sea experience", "تجربة على البحر الأحمر")}
          className="room-detail-hero-image"
        />
        <div className="room-detail-hero-shade" aria-hidden="true" />
        <header className="room-detail-header">
          <Link className="wordmark" href="/#home">
            <span className="wordmark-mark" aria-hidden="true">✳</span>
            <span className="wordmark-name">RED SEA <i>RESORT</i></span>
          </Link>
          <div className="room-detail-header-actions">
            <Link href="/#experiences">{translate(language, "All experiences", "كل التجارب")}</Link>
            <LanguageDropdown language={language} onChange={setLanguage} />
          </div>
        </header>

        <div className="room-detail-title">
          <p className="eyebrow">{translate(language, "MOMENTS TO REMEMBER", "لحظات تبقى")}</p>
          <h1>{experienceName}</h1>
          <a className="text-link room-detail-hero-link" href="#experience-gallery">
            {translate(language, "Explore the gallery", "شاهد الصور")}
            <span aria-hidden="true">↓</span>
          </a>
        </div>
        <Link className="room-back-link" href="/#experiences">
          {isArabic ? "← العودة إلى التجارب" : `← ${translate(language, "Back to experiences")}`}
        </Link>
      </section>

      <section className="room-detail-overview" aria-labelledby="experience-title">
        <Reveal className="room-detail-overview-copy">
          <p className="eyebrow">{translate(language, "DISCOVER THE RED SEA", "اكتشف البحر الأحمر")}</p>
          <h2 id="experience-title">{experienceName}</h2>
          <p className="room-detail-description">
            {localizedContent(language, {
              en: experience.description_en,
              ar: experience.description_ar,
              ru: experience.description_ru,
              de: experience.description_de,
            })}
          </p>
        </Reveal>
        <Reveal className="room-detail-facts">
          <div className="room-detail-fact">
            <span className="eyebrow">{translate(language, "PRICE", "السعر")}</span>
            <p><span className="numeric-value">{experience.price}</span> <small>{experience.currency}</small></p>
          </div>
          {experience.duration_minutes !== null && (
            <div className="room-detail-fact">
              <span className="eyebrow">{translate(language, "DURATION", "المدة")}</span>
              <p><span className="numeric-value">{experience.duration_minutes}</span> <small>{translate(language, "minutes", "دقيقة")}</small></p>
            </div>
          )}
        </Reveal>
      </section>

      {media && media.photos.length > 1 && (
        <section className="room-gallery-section" id="experience-gallery" aria-labelledby="experience-gallery-heading">
          <Reveal className="room-gallery-heading">
            <p className="eyebrow">{translate(language, "A CLOSER LOOK", "من التجربة")}</p>
            <h2 id="experience-gallery-heading">
              {translate(language, "See every moment.", "استكشف كل لحظة.")}
            </h2>
          </Reveal>
          <MediaFrame
            src={currentPhoto?.src ?? ""}
            alt={experienceName}
            fallbackLabel={translate(language, "Experience gallery", "صور التجربة")}
            className="room-gallery-featured"
          />
          <div className="room-gallery-grid">
            {media.photos.map((photo, index) => (
              <button
                className={`room-gallery-thumb ${currentPhoto?.fileName === photo.fileName ? "is-selected" : ""}`}
                key={photo.fileName}
                type="button"
                onClick={() => setSelectedPhoto(photo.fileName)}
                aria-pressed={currentPhoto?.fileName === photo.fileName}
                aria-label={translateWithValues(language, "View photo {number}", `عرض الصورة ${index + 1}`, { number: index + 1 })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={`${experienceName} ${index + 1}`}
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

      <footer className="site-footer">
        <Link className="wordmark footer-wordmark" href="/#home">
          <span className="wordmark-mark" aria-hidden="true">✳</span>
          <span className="wordmark-name">RED SEA <i>RESORT</i></span>
        </Link>
        <Link href="/#experiences">{translate(language, "ALL EXPERIENCES", "كل التجارب")}</Link>
        <a href="#experience-title">{translate(language, "BACK TO TOP ↑", "العودة إلى الأعلى ↑")}</a>
      </footer>
    </main>
  );
}
