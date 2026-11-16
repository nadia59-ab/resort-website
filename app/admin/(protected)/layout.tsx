import type { ReactNode } from "react";
import { requireAdmin } from "@/src/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}
