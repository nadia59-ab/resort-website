import { redirect } from "next/navigation";
import AdminLoginForm from "./login-form";
import { getAdminUser } from "@/src/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminUser()) redirect("/admin");
  return <AdminLoginForm />;
}
