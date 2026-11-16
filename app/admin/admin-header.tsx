"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/src/lib/supabase-browser";
import { adminLabel } from "./admin-language";
import { useAdminLanguage } from "./use-admin-language";

export type AdminSection = "bookings" | "pricing" | "offers" | "media";

export default function AdminHeader({ active }: { active: AdminSection }) {
  const [language, setLanguage] = useAdminLanguage();
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const { error } = await createSupabaseBrowserClient().auth.signOut();
      if (error) {
        setLoggingOut(false);
        return;
      }
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const links: { section: AdminSection; href: string; label: "bookingsNav" | "pricingNav" | "offersNav" | "mediaNav" }[] = [
    { section: "bookings", href: "/admin", label: "bookingsNav" },
    { section: "pricing", href: "/admin/pricing", label: "pricingNav" },
    { section: "offers", href: "/admin/offers", label: "offersNav" },
    { section: "media", href: "/admin/media", label: "mediaNav" },
  ];

  return (
    <header className="admin-header">
      <Link className="admin-brand" href="/" aria-label={adminLabel(language, "resort")}>
        <span className="admin-brand-mark" aria-hidden="true">✳</span>
        <span>RED SEA <i>RESORT</i></span>
      </Link>
      <nav className="admin-nav" aria-label={adminLabel(language, "ownerPanel")}>
        {links.map(({ section, href, label }) => (
          <Link key={section} href={href} aria-current={active === section ? "page" : undefined}>
            {adminLabel(language, label)}
          </Link>
        ))}
      </nav>
      <div className="admin-header-actions">
        <label className="admin-language-control">
          <span className="sr-only">{adminLabel(language, "language")}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)}>
            <option value="ar">العربية</option>
            <option value="en">EN</option>
            <option value="ru">RU</option>
            <option value="de">DE</option>
          </select>
        </label>
        <button className="admin-logout-button" type="button" onClick={logout} disabled={loggingOut}>
          {adminLabel(language, "logout")}
        </button>
      </div>
    </header>
  );
}
