import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseAuthServerClient } from "@/src/lib/supabase-auth-server";
import { getSupabaseServerClient } from "@/src/lib/supabase-server";

export async function getAdminUser(): Promise<User | null> {
  try {
    const authClient = await createSupabaseAuthServerClient();
    const { data: { user }, error } = await authClient.auth.getUser();
    if (error || !user) return null;

    const adminClient = getSupabaseServerClient();
    const { data: admin, error: adminError } = await adminClient
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    return adminError || !admin ? null : user;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}
