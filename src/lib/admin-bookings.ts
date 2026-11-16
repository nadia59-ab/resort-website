import "server-only";

import { getSupabaseServerClient } from "@/src/lib/supabase-server";

export type AdminBooking = {
  id: string;
  check_in: string;
  check_out: string;
  guests_count: number;
  original_price: number;
  discount_amount: number;
  total_price: number;
  currency: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  guest: { first_name: string; last_name: string; email: string; phone: string | null } | null;
  room: {
    room_type: {
      name_en: string;
      name_ar: string;
      name_ru: string | null;
      name_de: string | null;
    } | null;
  } | null;
};

export async function getAdminBookings(): Promise<AdminBooking[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, check_in, check_out, guests_count, original_price, discount_amount, total_price, currency, status, created_at,
      guest:guests(first_name, last_name, email, phone),
      room:rooms(room_type:room_types(name_en, name_ar, name_ru, name_de))
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Could not load bookings.");
  return (data ?? []) as unknown as AdminBooking[];
}
