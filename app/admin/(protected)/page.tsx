import AdminDashboard from "../admin-dashboard";
import { getAdminBookings } from "@/src/lib/admin-bookings";
import { requireAdmin } from "@/src/lib/admin-auth";

export const dynamic = "force-dynamic";

async function loadBookings() {
  await requireAdmin();
  try {
    return await getAdminBookings();
  } catch {
    return null;
  }
}

export default async function AdminHomePage() {
  const bookings = await loadBookings();
  return bookings
    ? <AdminDashboard bookings={bookings} />
    : <AdminDashboard bookings={[]} hasLoadError />;
}
