"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminBooking } from "@/src/lib/admin-bookings";
import { adminLabel, type AdminLanguage } from "./admin-language";
import { useAdminLanguage } from "./use-admin-language";
import { updateBookingStatus } from "./actions";
import AdminHeader from "./admin-header";

type BookingFilter = "all" | "pending" | "confirmed" | "cancelled";

function todayInResortTimezone() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function localRoomName(booking: AdminBooking, language: AdminLanguage) {
  const room = booking.room?.room_type;
  if (!room) return "—";
  if (language === "ar") return room.name_ar || room.name_en;
  if (language === "ru") return room.name_ru || room.name_en;
  if (language === "de") return room.name_de || room.name_en;
  return room.name_en;
}

export default function AdminDashboard({
  bookings,
  hasLoadError = false,
}: {
  bookings: AdminBooking[];
  hasLoadError?: boolean;
}) {
  const [language] = useAdminLanguage();
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [actionMessage, setActionMessage] = useState("");
  const [isUpdating, startTransition] = useTransition();
  const router = useRouter();

  const visibleBookings = filter === "all"
    ? bookings
    : bookings.filter((booking) => booking.status === filter);
  const filterTabs: { key: BookingFilter; label: "allFilter" | "pendingFilter" | "confirmedFilter" | "cancelledFilter" }[] = [
    { key: "all", label: "allFilter" },
    { key: "pending", label: "pendingFilter" },
    { key: "confirmed", label: "confirmedFilter" },
    { key: "cancelled", label: "cancelledFilter" },
  ];

  function changeBookingStatus(bookingId: string, status: "confirmed" | "cancelled" | "completed") {
    if (status === "cancelled" && !window.confirm(adminLabel(language, "cancelConfirm"))) return;
    setActionMessage("");
    startTransition(async () => {
      try {
        const result = await updateBookingStatus(bookingId, status);
        setActionMessage(adminLabel(
          language,
          result.ok ? "statusUpdated" : result.reason === "checkout_in_future" ? "completionNotDue" : "statusUpdateError",
        ));
        if (result.ok) router.refresh();
      } catch {
        setActionMessage(adminLabel(language, "statusUpdateError"));
      }
    });
  }

  const locale = { ar: "ar-EG", en: "en-US", ru: "ru-RU", de: "de-DE" }[language];
  const today = todayInResortTimezone();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  return (
    <main className="admin-app" dir={language === "ar" ? "rtl" : "ltr"} lang={language}>
      <AdminHeader active="bookings" />

      <section className="admin-content">
        <div className="admin-page-heading">
          <div>
            <p className="admin-eyebrow">{adminLabel(language, "ownerPanel")}</p>
            <h1>{adminLabel(language, "dashboard")}</h1>
            <p>{adminLabel(language, "dashboardHelp")}</p>
          </div>
          <span className="admin-booking-count">{numberFormatter.format(bookings.length)}</span>
        </div>

        <div className="admin-booking-toolbar">
          <div className="admin-filter-tabs" role="group" aria-label={adminLabel(language, "status")}>
            {filterTabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`admin-filter-tab${filter === key ? " is-active" : ""}`}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {adminLabel(language, label)}
                <span>{numberFormatter.format(key === "all" ? bookings.length : bookings.filter((booking) => booking.status === key).length)}</span>
              </button>
            ))}
          </div>
          {actionMessage && <p className="admin-action-message" role="status">{actionMessage}</p>}
        </div>

        <div className="admin-table-card">
          {hasLoadError ? (
            <p className="admin-table-message admin-error" role="status">{adminLabel(language, "loadError")}</p>
          ) : visibleBookings.length === 0 ? (
            <p className="admin-table-message">{bookings.length === 0 ? adminLabel(language, "empty") : adminLabel(language, "noFilteredBookings")}</p>
          ) : (
            <div className="admin-table-scroll">
              <table className="admin-bookings-table">
                <thead>
                  <tr>
                    {(["bookingNumber", "guest", "emailColumn", "phone", "room", "checkIn", "checkOut", "guests", "originalTotal", "discountAmount", "finalTotal", "status", "created", "actions"] as const).map((key) => (
                      <th key={key} scope="col">{adminLabel(language, key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="admin-booking-id">{booking.id.slice(0, 8).toUpperCase()}</td>
                      <td>{booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : "—"}</td>
                      <td dir="ltr">{booking.guest?.email ?? "—"}</td>
                      <td dir="ltr">{booking.guest?.phone ?? "—"}</td>
                      <td>{localRoomName(booking, language)}</td>
                      <td dir="ltr">{dateFormatter.format(new Date(`${booking.check_in}T00:00:00Z`))}</td>
                      <td dir="ltr">{dateFormatter.format(new Date(`${booking.check_out}T00:00:00Z`))}</td>
                      <td>{numberFormatter.format(booking.guests_count)}</td>
                      <td dir="ltr">{new Intl.NumberFormat(locale, { style: "currency", currency: booking.currency }).format(Number(booking.original_price ?? booking.total_price))}</td>
                      <td dir="ltr">−{new Intl.NumberFormat(locale, { style: "currency", currency: booking.currency }).format(Number(booking.discount_amount ?? 0))}</td>
                      <td dir="ltr">{new Intl.NumberFormat(locale, { style: "currency", currency: booking.currency }).format(Number(booking.total_price))}</td>
                      <td><span className={`admin-status admin-status--${booking.status}`}>{adminLabel(language, booking.status)}</span></td>
                      <td dir="ltr">{dateFormatter.format(new Date(booking.created_at))}</td>
                      <td>
                        <div className="admin-booking-actions">
                          {booking.status === "pending" && (
                            <>
                              <button type="button" className="admin-row-action admin-row-action--confirm" disabled={isUpdating} onClick={() => changeBookingStatus(booking.id, "confirmed")}>{adminLabel(language, "confirmAction")}</button>
                              <button type="button" className="admin-row-action admin-row-action--cancel" disabled={isUpdating} onClick={() => changeBookingStatus(booking.id, "cancelled")}>{adminLabel(language, "cancelAction")}</button>
                            </>
                          )}
                          {booking.status === "confirmed" && (
                            <>
                              <button type="button" className="admin-row-action admin-row-action--cancel" disabled={isUpdating} onClick={() => changeBookingStatus(booking.id, "cancelled")}>{adminLabel(language, "cancelAction")}</button>
                              {booking.check_out <= today && <button type="button" className="admin-row-action admin-row-action--complete" disabled={isUpdating} onClick={() => changeBookingStatus(booking.id, "completed")}>{adminLabel(language, "completeAction")}</button>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <footer className="admin-footer">RED SEA RESORT <span>·</span> {adminLabel(language, "ownerPanel")}</footer>
    </main>
  );
}
