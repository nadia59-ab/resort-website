import { getSupabaseServerClient } from "@/src/lib/supabase-server";
import { addEmptyTranslations, isMissingTranslationColumns } from "@/src/lib/catalog-translations";
import { calculateStayPrice, getOffersForStay } from "@/src/lib/booking-pricing";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value;
}

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

function validateStay(checkIn: unknown, checkOut: unknown) {
  if (!isDateString(checkIn) || !isDateString(checkOut)) {
    return { error: "Enter valid check-in and check-out dates." } as const;
  }
  if (checkIn < todayInResortTimezone()) {
    return { error: "Check-in cannot be in the past." } as const;
  }
  if (checkOut <= checkIn) {
    return { error: "Check-out must be after check-in." } as const;
  }

  const nights =
    (Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`)) /
    86_400_000;
  return { checkIn, checkOut, nights } as const;
}

async function getAvailableRooms(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  roomTypeId: string,
  checkIn: string,
  checkOut: string,
) {
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, room_number")
    .eq("room_type_id", roomTypeId)
    .eq("is_active", true)
    .order("room_number");

  if (roomsError) throw roomsError;
  if (!rooms?.length) return [];

  const { data: overlappingBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("room_id")
    .in("room_id", rooms.map((room) => room.id))
    .in("status", ["pending", "confirmed"])
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

  if (bookingsError) throw bookingsError;

  const occupiedRoomIds = new Set((overlappingBookings ?? []).map((booking) => booking.room_id));
  return rooms.filter((room) => !occupiedRoomIds.has(room.id));
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const checkIn = url.searchParams.get("check_in");
  const checkOut = url.searchParams.get("check_out");
  const guestsCount = Number(url.searchParams.get("guests_count"));
  const stay = validateStay(checkIn, checkOut);

  if ("error" in stay) return jsonError(stay.error ?? "Enter valid check-in and check-out dates.", 400);
  if (!Number.isSafeInteger(guestsCount) || guestsCount < 1 || guestsCount > 1000) {
    return jsonError("Enter a valid number of guests.", 400);
  }

  try {
    const supabase = getSupabaseServerClient();
    const initialRoomTypesResult = await supabase
      .from("room_types")
      .select("id, name_en, name_ar, name_ru, name_de, base_price, currency, max_guests")
      .gte("max_guests", guestsCount);

    let roomTypes = initialRoomTypesResult.data;
    let roomTypesError = initialRoomTypesResult.error;
    if (isMissingTranslationColumns(roomTypesError)) {
      const fallbackResult = await supabase
        .from("room_types")
        .select("id, name_en, name_ar, base_price, currency, max_guests")
        .gte("max_guests", guestsCount);
      roomTypes = fallbackResult.data as typeof roomTypes;
      roomTypesError = fallbackResult.error;
    }

    if (roomTypesError) throw roomTypesError;
    if (!roomTypes?.length) {
      return Response.json({ roomTypes: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    roomTypes = addEmptyTranslations(roomTypes);

    const offers = await getOffersForStay(supabase, stay.checkIn, stay.checkOut);
    const options = await Promise.all(
      roomTypes.map(async (roomType) => {
        const availableRooms = await getAvailableRooms(
          supabase,
          roomType.id,
          stay.checkIn,
          stay.checkOut,
        );
        if (availableRooms.length === 0) return null;
        return {
          ...roomType,
          pricing: calculateStayPrice(
            roomType.id,
            Number(roomType.base_price),
            roomType.currency,
            stay.nights,
            offers,
          ),
        };
      }),
    );

    return Response.json(
      { roomTypes: options.filter((roomType) => roomType !== null) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not check room availability", error);
    return jsonError("Could not check availability. Please try again.", 500);
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  let isSameOrigin = false;
  try {
    isSameOrigin = Boolean(origin) && new URL(origin!).origin === new URL(request.url).origin;
  } catch {
    isSameOrigin = false;
  }
  if (!isSameOrigin) {
    return jsonError("Request origin is not allowed.", 403);
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return jsonError("Send the booking details as JSON.", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_000) return jsonError("The booking request is too large.", 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("The booking request is not valid JSON.", 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return jsonError("Enter valid booking details.", 400);
  }

  const input = body as Record<string, unknown>;
  const stay = validateStay(input.check_in, input.check_out);
  if ("error" in stay) return jsonError(stay.error ?? "Enter valid check-in and check-out dates.", 400);

  const roomTypeId = input.room_type_id;
  const guestsCount = input.guests_count;
  const firstName = typeof input.first_name === "string" ? input.first_name.trim() : "";
  const lastName = typeof input.last_name === "string" ? input.last_name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";

  if (typeof roomTypeId !== "string" || !UUID_PATTERN.test(roomTypeId)) {
    return jsonError("Choose a valid room type.", 400);
  }
  if (!Number.isSafeInteger(guestsCount) || Number(guestsCount) < 1 || Number(guestsCount) > 1000) {
    return jsonError("Enter a valid number of guests.", 400);
  }
  if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100) {
    return jsonError("Enter a first and last name up to 100 characters each.", 400);
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return jsonError("Enter a valid email address.", 400);
  }
  if (phone.length > 40) return jsonError("Phone number must be 40 characters or fewer.", 400);

  try {
    const supabase = getSupabaseServerClient();
    const { data: roomType, error: roomTypeError } = await supabase
      .from("room_types")
      .select("id, base_price, currency, max_guests")
      .eq("id", roomTypeId)
      .maybeSingle();

    if (roomTypeError) throw roomTypeError;
    if (!roomType) return jsonError("That room type is not available.", 404);
    if (Number(guestsCount) > roomType.max_guests) {
      return jsonError("The selected room type does not fit that many guests.", 400);
    }

    const availableRooms = await getAvailableRooms(
      supabase,
      roomTypeId,
      stay.checkIn,
      stay.checkOut,
    );
    if (!availableRooms.length) return jsonError("No rooms of that type are available for those dates.", 409);

    let guestId: string | null = null;
    const { data: existingGuest, error: guestLookupError } = await supabase
      .from("guests")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (guestLookupError) throw guestLookupError;
    guestId = existingGuest?.id ?? null;

    if (!guestId) {
      const { data: newGuest, error: guestInsertError } = await supabase
        .from("guests")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
        })
        .select("id")
        .single();

      if (guestInsertError?.code === "23505") {
        const { data: guestAfterRace, error: retryLookupError } = await supabase
          .from("guests")
          .select("id")
          .eq("email", email)
          .maybeSingle();
        if (retryLookupError) throw retryLookupError;
        guestId = guestAfterRace?.id ?? null;
      } else if (guestInsertError) {
        throw guestInsertError;
      } else {
        guestId = newGuest.id;
      }
    }

    if (!guestId) throw new Error("Could not find or create the guest record.");

    const offers = await getOffersForStay(supabase, stay.checkIn, stay.checkOut);
    const pricing = calculateStayPrice(
      roomType.id,
      Number(roomType.base_price),
      roomType.currency,
      stay.nights,
      offers,
    );

    for (const room of availableRooms) {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          guest_id: guestId,
          room_id: room.id,
          check_in: stay.checkIn,
          check_out: stay.checkOut,
          guests_count: Number(guestsCount),
          total_price: pricing.totalPrice,
          original_price: pricing.originalPrice,
          discount_amount: pricing.discountAmount,
          offer_id: pricing.offerId,
          currency: roomType.currency,
        })
        .select("id")
        .single();

      if (!bookingError) {
        return Response.json({ booking_id: booking.id, pricing }, { status: 201 });
      }
      if (bookingError.code !== "23P01") throw bookingError;
    }

    return jsonError("The room was just booked. Please choose another date or room type.", 409);
  } catch (error) {
    console.error("Could not save booking", error);
    return jsonError("Could not save the booking. Please try again.", 500);
  }
}
