"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Language } from "@/src/lib/i18n";
import { localizedContent, translate, translateMessage, translateWithValues } from "@/src/lib/i18n";

type AvailableRoomType = {
  id: string;
  name_en: string;
  name_ar: string;
  name_ru: string | null;
  name_de: string | null;
  base_price: number;
  currency: string;
  max_guests: number;
  pricing?: {
    currency: string;
    originalPrice: number;
    discountAmount: number;
    totalPrice: number;
    offerId: string | null;
  };
};

type BookingFormProps = {
  language: Language;
  checkIn: string;
  checkOut: string;
  guestsCount: string;
  selectedRoomType: string;
  setSelectedRoomType: Dispatch<SetStateAction<string>>;
  showStayFields?: boolean;
  setCheckIn?: Dispatch<SetStateAction<string>>;
  setCheckOut?: Dispatch<SetStateAction<string>>;
  setGuestsCount?: Dispatch<SetStateAction<string>>;
};

export default function BookingForm({
  language,
  checkIn,
  checkOut,
  guestsCount,
  selectedRoomType,
  setSelectedRoomType,
  showStayFields = false,
  setCheckIn,
  setCheckOut,
  setGuestsCount,
}: BookingFormProps) {
  const isArabic = language === "ar";
  const hasAvailabilityInputs = Boolean(checkIn && checkOut && guestsCount);
  const [roomTypes, setRoomTypes] = useState<AvailableRoomType[]>([]);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [dateMissing, setDateMissing] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedBookingPrice, setCompletedBookingPrice] = useState<{
    checkIn: string;
    checkOut: string;
    guestsCount: string;
    roomTypeId: string;
    pricing: NonNullable<AvailableRoomType["pricing"]>;
  } | null>(null);
  const [refreshAvailability, setRefreshAvailability] = useState(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!checkIn || !checkOut || !guestsCount) {
      queueMicrotask(() => {
        setRoomTypes([]);
        setAvailabilityMessage("");
        setLoadingOptions(false);
      });
      return;
    }

    const controller = new AbortController();
    const query = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      guests_count: guestsCount,
    });

    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setLoadingOptions(true);
      setRoomTypes([]);
      setAvailabilityMessage("");
    });

    fetch(`/api/bookings?${query.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not check availability.");
        const availableRoomTypes = result.roomTypes as AvailableRoomType[];
        setRoomTypes(availableRoomTypes);
        setSelectedRoomType((current) =>
          availableRoomTypes.some((roomType) => roomType.id === current) ? current : "",
        );
        setAvailabilityMessage(
          result.roomTypes.length === 0
            ? translate(language, "No rooms are available for those dates and guests.", "لا توجد غرف متاحة لهذه التواريخ وعدد الضيوف.")
            : "",
        );
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setAvailabilityMessage(
          error instanceof Error
            ? translateMessage(language, error.message)
            : translate(language, "Could not check availability. Please try again.", "تعذر التحقق من التوافر. حاول مرة أخرى."),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOptions(false);
      });

    return () => controller.abort();
  }, [checkIn, checkOut, guestsCount, language, isArabic, refreshAvailability, setSelectedRoomType]);

  const visibleRoomTypes = hasAvailabilityInputs ? roomTypes : [];
  const isCheckingAvailability = hasAvailabilityInputs && loadingOptions;

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!checkIn || !checkOut) {
      setDateMissing(true);
      return;
    }
    setFeedback("");
    setCompletedBookingPrice(null);
    submittingRef.current = true;
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const requestBody = {
      check_in: checkIn,
      check_out: checkOut,
      guests_count: Number(guestsCount),
      room_type_id: selectedRoomType,
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
    };

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save the booking.");

      setFeedback(translateWithValues(language, "Booking request received. Booking ID: {id}", `تم استلام طلب الحجز. رقم الحجز: ${result.booking_id}`, { id: result.booking_id }));
      if (result.pricing) {
        setCompletedBookingPrice({ checkIn, checkOut, guestsCount, roomTypeId: selectedRoomType, pricing: result.pricing });
      }
      setSelectedRoomType("");
      form.reset();
      setRefreshAvailability((value) => value + 1);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? translateMessage(language, error.message)
          : translate(language, "Could not save the booking. Please try again.", "تعذر حفظ الحجز. حاول مرة أخرى."),
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const nightCount = checkIn && checkOut
    ? Math.max(0, Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000))
    : 0;
  const nightLabel = language === "ru"
    ? translate(language, new Intl.PluralRules("ru-RU").select(nightCount) === "one" ? "night" : new Intl.PluralRules("ru-RU").select(nightCount) === "few" ? "nights-few" : "nights", "ليالٍ")
    : language === "de"
      ? translate(language, nightCount === 1 ? "night" : "nights", "ليالٍ")
      : language === "ar"
        ? nightCount === 1 ? "ليلة" : nightCount === 2 ? "ليلتان" : "ليالٍ"
        : nightCount === 1 ? "night" : "nights";
  const staySummary = checkIn && checkOut
    ? <><span className="numeric-value">{nightCount}</span> {nightLabel} · <span className="numeric-value">{guestsCount}</span> {translate(language, "guests", "ضيوف")}</>
    : translate(language, "Please choose your dates", "يرجى اختيار تواريخ الإقامة");
  const selectedRoom = visibleRoomTypes.find((roomType) => roomType.id === selectedRoomType);
  const selectedPricing = selectedRoom?.pricing ?? (
    completedBookingPrice
    && completedBookingPrice.checkIn === checkIn
    && completedBookingPrice.checkOut === checkOut
    && completedBookingPrice.guestsCount === guestsCount
    && (!selectedRoomType || completedBookingPrice.roomTypeId === selectedRoomType)
      ? completedBookingPrice.pricing
      : undefined
  );
  const selectedCurrency = selectedRoom?.currency ?? selectedPricing?.currency ?? "USD";
  const formatPrice = (amount: number) => new Intl.NumberFormat(
    { en: "en-US", ar: "ar-EG", ru: "ru-RU", de: "de-DE" }[language],
    { style: "currency", currency: selectedCurrency },
  ).format(amount);

  return (
    <div className="booking-form-wrap">
      <div className="booking-summary">
        <div>
          <span className="eyebrow">{translate(language, "YOUR STAY", "تفاصيل الإقامة")}</span>
          <p>{staySummary}</p>
          {selectedPricing && (
            <dl className="booking-price-breakdown" aria-live="polite">
              <div>
                <dt>{translate(language, "Original price", "السعر الأصلي")}</dt>
                <dd>{formatPrice(selectedPricing.originalPrice)}</dd>
              </div>
              <div>
                <dt>{translate(language, "Discount", "الخصم")}</dt>
                <dd>−{formatPrice(selectedPricing.discountAmount)}</dd>
              </div>
              <div className="booking-price-final">
                <dt>{translate(language, "Final price", "السعر النهائي")}</dt>
                <dd>{formatPrice(selectedPricing.totalPrice)}</dd>
              </div>
            </dl>
          )}
        </div>
        {showStayFields && <a href="#home">{translate(language, "Edit", "تعديل")} <span aria-hidden="true">↗</span></a>}
      </div>

      <form className={`booking-form${showStayFields ? " booking-form--home" : ""}`} onSubmit={submitBooking}>
        {showStayFields && (
          <div className="booking-stay-fields">
            <label>
              <span>{translate(language, "Check in", "الوصول")}</span>
              <input type="date" value={checkIn} onChange={(event) => setCheckIn?.(event.target.value)} aria-label={translate(language, "Check-in date", "تاريخ الوصول")} />
            </label>
            <label>
              <span>{translate(language, "Check out", "المغادرة")}</span>
              <input type="date" value={checkOut} onChange={(event) => setCheckOut?.(event.target.value)} aria-label={translate(language, "Check-out date", "تاريخ المغادرة")} />
            </label>
            <label>
              <span>{translate(language, "Guests", "الضيوف")}</span>
              <input type="number" min="1" max="1000" value={guestsCount} onChange={(event) => setGuestsCount?.(event.target.value)} aria-label={translate(language, "Number of guests", "عدد الضيوف")} />
            </label>
          </div>
        )}
        <label>
          <span>{translate(language, "Room type", "نوع الغرفة")}</span>
          <select
            name="room_type_id"
            required
            value={selectedRoomType}
            disabled={isCheckingAvailability || visibleRoomTypes.length === 0}
            onChange={(event) => setSelectedRoomType(event.target.value)}
          >
            <option value="">
              {isCheckingAvailability
                ? translate(language, "Checking availability...", "جارٍ التحقق من التوافر...")
                : translate(language, "Choose an available room type", "اختر نوع الغرفة المتاح")}
            </option>
            {visibleRoomTypes.map((roomType) => (
              <option key={roomType.id} value={roomType.id}>
                {localizedContent(language, {
                  en: roomType.name_en,
                  ar: roomType.name_ar,
                  ru: roomType.name_ru,
                  de: roomType.name_de,
                })} — {roomType.base_price}{" "}
                {roomType.currency} / {translate(language, "night", "ليلة")}
              </option>
            ))}
          </select>
        </label>

        {hasAvailabilityInputs && availabilityMessage && <p className="form-message" role="status">{availabilityMessage}</p>}

        <div className="booking-contact-grid">
          <label>
            <span>{translate(language, "First name", "الاسم الأول")}</span>
            <input type="text" name="first_name" autoComplete="given-name" required maxLength={100} />
          </label>
          <label>
            <span>{translate(language, "Last name", "اسم العائلة")}</span>
            <input type="text" name="last_name" autoComplete="family-name" required maxLength={100} />
          </label>
          <label>
            <span>{translate(language, "Email", "البريد الإلكتروني")}</span>
            <input type="email" name="email" autoComplete="email" required maxLength={254} />
          </label>
          <label>
            <span>{translate(language, "Phone · optional", "الهاتف · اختياري")}</span>
            <input type="tel" name="phone" autoComplete="tel" maxLength={40} />
          </label>
        </div>

        <div className="booking-submit-row">
          <p>{translate(language, "Availability is checked again before your request is saved.", "سيتم تأكيد التوافر قبل حفظ طلبك.")}</p>
          <button
            className="button-dark"
            type="submit"
            disabled={submitting || isCheckingAvailability || (hasAvailabilityInputs && visibleRoomTypes.length === 0)}
            onClick={(event) => {
              if (!checkIn || !checkOut) {
                event.preventDefault();
                setDateMissing(true);
              }
            }}
          >
            {submitting
              ? translate(language, "Sending...", "جارٍ الإرسال...")
              : translate(language, "Request this stay", "إرسال طلب الحجز")}
            {submitting
              ? <span className="booking-submit-spinner" aria-hidden="true" />
              : <span aria-hidden="true">{isArabic ? "←" : "→"}</span>}
          </button>
        </div>
        {(feedback || (dateMissing && (!checkIn || !checkOut))) && (
          <p className="form-message" role="status">
            {feedback || translate(language, "Please choose your dates", "يرجى اختيار تواريخ الإقامة")}
          </p>
        )}
      </form>
    </div>
  );
}
